import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, OrderByCondition } from 'typeorm';
import { BaseShoppingCartRepository } from '../base-shopping-cart.repository';
import { ShoppingCartEntity } from '../entities/shopping-cart.entity';
import { ShoppingCart } from '@/shopping-carts/domain/shopping-cart';
import { ShoppingCartMapper } from '../mappers/shopping-cart.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllShoppingCartsDto } from '@/shopping-carts/dto/find-all-shopping-carts.dto';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { CartItemAddonEntity } from '@/cart-item-addons/persistence/entities/cart-item-addon.entity';
import { CartItemOptionEntity } from '@/cart-item-options/persistence/entities/cart-item-option.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';

/** Raw row shape returned by findSlimProductCartByUserId */
interface RawSlimCartRow {
  cart_id: number;
  item_id: number | null;
  item_type: string | null;
  item_quantity: number | null;
  item_is_selected: boolean | null;
  item_location_additional_fee: string | null;
  variant_id: number | null;
  variant_selling_price: string | null;
  variant_name: string | null;
  variant_status: string | null;
  vm_file_path: string | null;
  vm_thumbnail_path: string | null;
  vm_compressed_path: string | null;
  inv_available_quantity: number | null;
  product_id: number | null;
  product_name: string | null;
  pm_file_path: string | null;
  pm_thumbnail_path: string | null;
  pm_compressed_path: string | null;
  seller_id: number | null;
  store_name: string | null;
}

/**
 * Concrete implementation of shopping cart repository.
 *
 * Handles database operations for shopping carts using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ShoppingCartRepository extends BaseShoppingCartRepository {
  private readonly s3PublicEndpoint: string;
  private readonly s3Bucket: string;

  constructor(
    @InjectRepository(ShoppingCartEntity)
    private readonly repository: Repository<ShoppingCartEntity>,
    private readonly configService: ConfigService,
  ) {
    super();
    this.s3PublicEndpoint =
      this.configService.get<string>('storage.config.publicEndpoint', {
        infer: true,
      }) || 'http://localhost:9002';
    this.s3Bucket =
      this.configService.get<string>('storage.config.bucket', {
        infer: true,
      }) || 'media';
  }

  /**
   * Find shopping carts with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme load options.
   * Used for admin/reporting interfaces with advanced filtering capabilities.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise with data array and totalCount
   */
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    // Define field mappings for filtering and sorting
    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['shopping_carts.id'],
      },
      {
        field: 'user_id',
        relatedFields: ['shopping_carts.user_id'],
      },
      {
        field: 'user',
        relatedFields: ['user.first_name', 'user.last_name', 'user.email'],
      },
      {
        field: 'created_at',
        relatedFields: ['shopping_carts.created_at'],
      },
      {
        field: 'updated_at',
        relatedFields: ['shopping_carts.updated_at'],
      },
    ];

    // Process filters
    if (filter !== undefined) {
      let normalizedFilter: any = filter;
      if (typeof normalizedFilter === 'string') {
        try {
          normalizedFilter = JSON.parse(normalizedFilter);
        } catch {
          normalizedFilter = filter;
        }
      }
      filter = await createFieldFilters(normalizedFilter, fieldMaps);
    }

    // Process sorting
    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'shopping_carts.created_at': 'DESC' };
    }

    // Apply DevExtreme SQL strategy
    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    // Build query
    const query = this.repository
      .createQueryBuilder('shopping_carts')
      .leftJoinAndSelect('shopping_carts.user', 'user')
      .leftJoinAndSelect('shopping_carts.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect('variant.media', 'variant_media')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'product_media')
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ShoppingCartMapper.toDomain(entity));
    return { data, totalCount };
  }

  /**
   * Find all shopping carts with standard pagination.
   *
   * Simpler pagination method without DevExtreme complexity.
   * Supports basic search filtering by user email or cart ID.
   *
   * @param options - Filter query and pagination options
   * @returns Promise<IPaginatedResult<ShoppingCart>>
   */
  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllShoppingCartsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<ShoppingCart>> {
    const queryBuilder = this.repository
      .createQueryBuilder('shopping_carts')
      .leftJoinAndSelect('shopping_carts.user', 'user')
      .leftJoinAndSelect('shopping_carts.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect('variant.media', 'variant_media')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'product_media');

    // Apply search filter if provided
    if (filterQuery) {
      queryBuilder.where(
        '(user.email ILIKE :search OR CAST(shopping_carts.id AS TEXT) ILIKE :search)',
        { search: `%${filterQuery}%` },
      );
    }

    // Apply pagination
    const [entities, totalResults] = await queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit)
      .orderBy('shopping_carts.created_at', 'DESC')
      .getManyAndCount();

    const data = entities.map((entity) => ShoppingCartMapper.toDomain(entity));
    return { data, totalResults };
  }

  /**
   * Create a new shopping cart for a user.
   *
   * @param data - Shopping cart domain model
   * @returns Promise<ShoppingCart> - Created cart with relations
   */
  async create(data: ShoppingCart): Promise<ShoppingCart> {
    const persistenceModel = ShoppingCartMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    // Fetch with relations
    const entityWithRelations = await this.repository.findOne({
      where: { id: newEntity.id },
      relations: ['user', 'items', 'created_by', 'updated_by'],
    });

    if (!entityWithRelations) {
      throw new Error('Failed to create shopping cart');
    }

    return ShoppingCartMapper.toDomain(entityWithRelations);
  }

  /**
   * Build a MinIO/S3 image URL from stored paths.
   * Mirrors MediaMapper.buildUrl logic: prefers thumbnail → compressed → original.
   */
  private buildImageUrl(
    filePath: string | null,
    thumbPath: string | null,
    compPath: string | null,
  ): string | null {
    const chosen = thumbPath ?? compPath ?? filePath;
    if (!chosen) return null;
    const encoded = chosen
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    return `${this.s3PublicEndpoint}/${this.s3Bucket}/${encoded}`;
  }

  /**
   * Slim single-query fetch for the mobile cart page.
   *
   * Uses getRawMany() with explicit column projections — no TypeORM entity
   * hydration, no mapper calls, no service-related JOINs.
   * Only product items are returned; summary and stores are built in-memory.
   */
  async findSlimProductCartByUserId(
    userId: number,
  ): Promise<ShoppingCart | null> {
    const rows = await this.repository.manager
      .createQueryBuilder()
      .select('cart.id', 'cart_id')
      // item columns
      .addSelect('item.id', 'item_id')
      .addSelect('item.item_type', 'item_type')
      .addSelect('item.quantity', 'item_quantity')
      .addSelect('item.is_selected', 'item_is_selected')
      .addSelect('item.location_additional_fee', 'item_location_additional_fee')
      // variant columns
      .addSelect('variant.id', 'variant_id')
      .addSelect('variant.selling_price', 'variant_selling_price')
      .addSelect('variant.variant_name', 'variant_name')
      .addSelect('variant.status', 'variant_status')
      // variant media paths (URL built in app)
      .addSelect('vm.file_path', 'vm_file_path')
      .addSelect('vm.thumbnail_path', 'vm_thumbnail_path')
      .addSelect('vm.compressed_path', 'vm_compressed_path')
      // inventory
      .addSelect('inv.available_quantity', 'inv_available_quantity')
      // product columns
      .addSelect('product.id', 'product_id')
      .addSelect('product.product_name', 'product_name')
      // primary product image paths (URL built in app)
      .addSelect('pm.file_path', 'pm_file_path')
      .addSelect('pm.thumbnail_path', 'pm_thumbnail_path')
      .addSelect('pm.compressed_path', 'pm_compressed_path')
      // seller columns
      .addSelect('seller.id', 'seller_id')
      .addSelect('seller.store_name', 'store_name')
      .from('shopping_carts', 'cart')
      // LEFT JOIN items: only non-deleted product items
      .leftJoin(
        'shopping_cart_items',
        'item',
        'item.shopping_cart_id = cart.id AND item.item_type = :type AND item.deleted_at IS NULL',
        { type: CartItemTypeEnum.PRODUCT },
      )
      // All subsequent joins are safe to LEFT JOIN because the root is the cart
      .leftJoin('product_variants', 'variant', 'variant.id = item.variant_id')
      .leftJoin('products', 'product', 'product.id = variant.product_id')
      .leftJoin('sellers', 'seller', 'seller.id = product.seller_id')
      .leftJoin('inventory_stocks', 'inv', 'inv.variant_id = variant.id')
      .leftJoin('media', 'vm', 'vm.id = variant.media_id')
      // Subquery: one primary image per product (no row multiplication)
      .leftJoin(
        (qb) =>
          qb
            .select('pmm.product_id', 'pmm_pid')
            .addSelect(
              '(array_agg(pmm.media_id ORDER BY pmm.display_order ASC))[1]',
              'pmm_mid',
            )
            .from('product_media_mappings', 'pmm')
            .where('pmm.is_primary = true')
            .groupBy('pmm.product_id'),
        'prim',
        'prim.pmm_pid = product.id',
      )
      .leftJoin('media', 'pm', 'pm.id = prim.pmm_mid')
      .where('cart.user_id = :userId', { userId })
      .andWhere('cart.deleted_at IS NULL')
      .orderBy('item.created_at', 'DESC')
      .getRawMany<RawSlimCartRow>();

    if (rows.length === 0) return null;

    const cartId = rows[0].cart_id;

    // Assemble items as plain objects — avoids class-transformer decorator
    // processing and ResolvePromisesInterceptor deep traversal overhead
    // that occurs when using `new ShoppingCartItem()` class instances.
    const items: ShoppingCartItem[] = [];
    for (const row of rows) {
      if (row.item_id === null) continue; // cart exists but has no product items

      const unitPrice =
        parseFloat(row.variant_selling_price as unknown as string) || 0;
      const qty = Number(row.item_quantity);

      items.push({
        id: row.item_id,
        shopping_cart_id: cartId,
        item_type: CartItemTypeEnum.PRODUCT,
        quantity: qty,
        is_selected: Boolean(row.item_is_selected),
        location_additional_fee: row.item_location_additional_fee
          ? parseFloat(row.item_location_additional_fee)
          : null,
        unit_price: unitPrice,
        total_price: Math.round(unitPrice * qty * 100) / 100,
        variant: {
          id: row.variant_id,
          selling_price: unitPrice,
          variant_name: row.variant_name,
          status: row.variant_status,
          variant_image_url: this.buildImageUrl(
            row.vm_file_path,
            row.vm_thumbnail_path,
            row.vm_compressed_path,
          ),
          inventory_stock:
            row.inv_available_quantity !== null &&
            row.inv_available_quantity !== undefined
              ? { available_quantity: Number(row.inv_available_quantity) }
              : null,
          product: {
            id: row.product_id,
            product_name: row.product_name,
            product_image_url: this.buildImageUrl(
              row.pm_file_path,
              row.pm_thumbnail_path,
              row.pm_compressed_path,
            ),
            seller_id: row.seller_id ?? null,
            store_name: row.store_name ?? null,
          },
        },
      } as ShoppingCartItem);
    }

    // Return plain object — not a class instance — to skip
    // SafeSerializerInterceptor's instanceToPlain() deep processing.
    // Only `id`, `user_id`, `stores`, and `summary` are used by mobile.
    return {
      id: cartId,
      user_id: userId,
      stores: ShoppingCartMapper.groupItemsByStore(items),
      summary: ShoppingCartMapper.calculateSummary(items),
    } as ShoppingCart;
  }

  /**
   * Find a shopping cart by user ID.
   *
   * @param userId - The user's ID
   * @param includeItems - Whether to include cart items (default: true)
   * @returns Promise<ShoppingCart | null> - Cart if found, null otherwise
   */
  async findByUserId(
    userId: number,
    includeItems = true,
  ): Promise<ShoppingCart | null> {
    if (!includeItems) {
      const entity = await this.repository.findOne({
        where: { user_id: userId },
        relations: ['user'],
      });
      return entity ? ShoppingCartMapper.toDomain(entity) : null;
    }

    // Step 1: Main query — cart + items + ManyToOne relations only.
    // Excludes OneToMany relations (product_media_mappings, gallery,
    // cart_item_addons, cart_item_options) to prevent Cartesian product explosion.
    const entity = await this.repository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.user', 'user')
      .leftJoinAndSelect('cart.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect('variant.media', 'variant_media')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('service.seller', 'service_seller')
      .leftJoinAndSelect('service.category', 'service_category')
      .leftJoinAndSelect('items.package', 'package')
      .leftJoinAndSelect('items.service_address', 'service_address')
      .where('cart.user_id = :userId', { userId })
      .getOne();

    if (!entity) return null;

    const items = entity.items ?? [];

    if (items.length > 0) {
      const manager = this.repository.manager;
      const itemIds = items.map((i) => i.id);

      const productIds = [
        ...new Set(
          items
            .filter((i) => i.variant?.product?.id)
            .map((i) => i.variant!.product!.id),
        ),
      ];
      const serviceIds = [
        ...new Set(items.filter((i) => i.service_id).map((i) => i.service_id!)),
      ];

      // Steps 2–5: Batch-load all OneToMany data in parallel
      const [productMappings, galleries, addons, options] = await Promise.all([
        // Step 2: One primary image per product (ordered: is_primary DESC, display_order ASC)
        productIds.length > 0
          ? manager
              .getRepository(ProductMediaMappingEntity)
              .createQueryBuilder('pmm')
              .leftJoinAndSelect('pmm.media', 'media')
              .where('pmm.product_id IN (:...productIds)', { productIds })
              .orderBy('pmm.is_primary', 'DESC')
              .addOrderBy('pmm.display_order', 'ASC')
              .getMany()
          : Promise.resolve<ProductMediaMappingEntity[]>([]),

        // Step 3: Service galleries
        serviceIds.length > 0
          ? manager
              .getRepository(ServiceGalleryEntity)
              .createQueryBuilder('gal')
              .where('gal.service_id IN (:...serviceIds)', { serviceIds })
              .getMany()
          : Promise.resolve<ServiceGalleryEntity[]>([]),

        // Step 4: Cart item addons with addon details
        manager
          .getRepository(CartItemAddonEntity)
          .createQueryBuilder('cia')
          .leftJoinAndSelect('cia.addon', 'addon')
          .where('cia.cart_item_id IN (:...itemIds)', { itemIds })
          .getMany(),

        // Step 5: Cart item options with group and value details
        manager
          .getRepository(CartItemOptionEntity)
          .createQueryBuilder('cio')
          .leftJoinAndSelect('cio.option_group', 'option_group')
          .leftJoinAndSelect('cio.option_value', 'option_value')
          .where('cio.cart_item_id IN (:...itemIds)', { itemIds })
          .getMany(),
      ]);

      // Build O(1) lookup maps
      const primaryImageMap = new Map<number, ProductMediaMappingEntity>();
      for (const mapping of productMappings) {
        if (!primaryImageMap.has(mapping.product_id)) {
          primaryImageMap.set(mapping.product_id, mapping);
        }
      }

      const galleryByServiceId = new Map<number, ServiceGalleryEntity[]>();
      for (const g of galleries) {
        const list = galleryByServiceId.get(g.service_id) ?? [];
        list.push(g);
        galleryByServiceId.set(g.service_id, list);
      }

      const addonsByItemId = new Map<number, CartItemAddonEntity[]>();
      for (const a of addons) {
        const list = addonsByItemId.get(a.cart_item_id) ?? [];
        list.push(a);
        addonsByItemId.set(a.cart_item_id, list);
      }

      const optionsByItemId = new Map<number, CartItemOptionEntity[]>();
      for (const o of options) {
        const list = optionsByItemId.get(o.cart_item_id) ?? [];
        list.push(o);
        optionsByItemId.set(o.cart_item_id, list);
      }

      // Attach batch-loaded relations to item entities in memory
      for (const item of items) {
        if (item.variant?.product) {
          const primaryMapping = primaryImageMap.get(item.variant.product.id);
          item.variant.product.product_media_mappings = primaryMapping
            ? [primaryMapping]
            : [];
        }
        if (item.service) {
          item.service.gallery = galleryByServiceId.get(item.service_id!) ?? [];
        }
        item.cart_item_addons = addonsByItemId.get(item.id) ?? [];
        item.cart_item_options = optionsByItemId.get(item.id) ?? [];
      }
    }

    return ShoppingCartMapper.toDomain(entity);
  }

  /**
   * Find a shopping cart by cart ID.
   *
   * @param id - The cart ID
   * @param includeItems - Whether to include cart items (default: true)
   * @returns Promise<ShoppingCart | null> - Cart if found, null otherwise
   */
  async findById(
    id: number,
    includeItems = true,
  ): Promise<ShoppingCart | null> {
    const relations: string[] = ['user'];
    if (includeItems) {
      relations.push(
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.seller',
        'items.variant.inventory_stock',
        'items.variant.media',
        'items.variant.product.product_media_mappings',
        'items.variant.product.product_media_mappings.media',
        'items.service',
        'items.service.seller',
        'items.service.gallery',
        'items.service.category',
        'items.package',
        'items.service_address',
        'items.cart_item_addons',
        'items.cart_item_addons.addon',
        'items.cart_item_options',
        'items.cart_item_options.option_group',
        'items.cart_item_options.option_value',
      );
    }

    const entity = await this.repository.findOne({
      where: { id },
      relations,
    });

    return entity ? ShoppingCartMapper.toDomain(entity) : null;
  }

  /**
   * Find a shopping cart by cart ID with paginated items.
   *
   * Efficiently handles carts with large numbers of items (>100).
   * Uses query builder to paginate cart items at the database level.
   *
   * @param id - The cart ID
   * @param itemsPage - Page number for items (1-indexed)
   * @param itemsLimit - Number of items per page (max 100)
   * @returns Promise<ShoppingCart | null> - Cart with paginated items
   */
  async findByIdWithPaginatedItems(
    id: number,
    itemsPage: number,
    itemsLimit: number,
  ): Promise<ShoppingCart | null> {
    // First, get the cart without items
    const cartEntity = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!cartEntity) {
      return null;
    }

    // Calculate pagination
    const skip = (itemsPage - 1) * itemsLimit;

    // Fetch paginated items using query builder
    const itemsQuery = this.repository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect('variant.media', 'variant_media')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'product_media')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('service.seller', 'service_seller')
      .leftJoinAndSelect('service.gallery', 'service_gallery')
      .leftJoinAndSelect('service.category', 'service_category')
      .leftJoinAndSelect('items.package', 'package')
      .leftJoinAndSelect('items.service_address', 'service_address')
      // Include cart item addons and options with their details
      .leftJoinAndSelect('items.cart_item_addons', 'cart_item_addons')
      .leftJoinAndSelect('cart_item_addons.addon', 'addon')
      .leftJoinAndSelect('items.cart_item_options', 'cart_item_options')
      .leftJoinAndSelect('cart_item_options.option_group', 'option_group')
      .leftJoinAndSelect('cart_item_options.option_value', 'option_value')
      .where('cart.id = :id', { id })
      .skip(skip)
      .take(itemsLimit)
      .orderBy('items.created_at', 'DESC');

    const [cartWithItems] = await itemsQuery.getMany();

    // Merge the cart with paginated items
    if (cartWithItems) {
      cartEntity.items = cartWithItems.items;
    }

    return ShoppingCartMapper.toDomain(cartEntity);
  }

  /**
   * Find a shopping cart by user ID with paginated items.
   *
   * Efficiently handles carts with large numbers of items (>100).
   * Uses query builder to paginate cart items at the database level.
   *
   * @param userId - The user's ID
   * @param itemsPage - Page number for items (1-indexed)
   * @param itemsLimit - Number of items per page (max 100)
   * @returns Promise<ShoppingCart | null> - Cart with paginated items
   */
  async findByUserIdWithPaginatedItems(
    userId: number,
    itemsPage: number,
    itemsLimit: number,
  ): Promise<ShoppingCart | null> {
    // First, get the cart without items
    const cartEntity = await this.repository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!cartEntity) {
      return null;
    }

    // Calculate pagination
    const skip = (itemsPage - 1) * itemsLimit;

    // Fetch paginated items using query builder
    const itemsQuery = this.repository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect('variant.media', 'variant_media')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'product_media')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('service.seller', 'service_seller')
      .leftJoinAndSelect('service.gallery', 'service_gallery')
      .leftJoinAndSelect('service.category', 'service_category')
      .leftJoinAndSelect('items.package', 'package')
      .leftJoinAndSelect('items.service_address', 'service_address')
      // Include cart item addons and options with their details
      .leftJoinAndSelect('items.cart_item_addons', 'cart_item_addons')
      .leftJoinAndSelect('cart_item_addons.addon', 'addon')
      .leftJoinAndSelect('items.cart_item_options', 'cart_item_options')
      .leftJoinAndSelect('cart_item_options.option_group', 'option_group')
      .leftJoinAndSelect('cart_item_options.option_value', 'option_value')
      .where('cart.user_id = :userId', { userId })
      .skip(skip)
      .take(itemsLimit)
      .orderBy('items.created_at', 'DESC');

    const [cartWithItems] = await itemsQuery.getMany();

    // Merge the cart with paginated items
    if (cartWithItems) {
      cartEntity.items = cartWithItems.items;
    }

    return ShoppingCartMapper.toDomain(cartEntity);
  }

  /**
   * Update a shopping cart.
   *
   * @param id - The cart ID
   * @param payload - Partial cart data to update
   * @returns Promise<ShoppingCart> - Updated cart
   */
  async update(
    id: number,
    payload: Partial<ShoppingCart>,
  ): Promise<ShoppingCart> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Shopping cart not found');
    }

    const updatedEntity = await this.repository.save(
      this.repository.create(
        ShoppingCartMapper.toPersistence({
          ...ShoppingCartMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    const entityWithRelations = await this.repository.findOne({
      where: { id: updatedEntity.id },
      relations: ['user', 'items', 'created_by', 'updated_by'],
    });

    if (!entityWithRelations) {
      throw new Error('Failed to update shopping cart');
    }

    return ShoppingCartMapper.toDomain(entityWithRelations);
  }

  /**
   * Soft delete a shopping cart.
   *
   * @param id - The cart ID
   * @returns Promise<void>
   */
  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
