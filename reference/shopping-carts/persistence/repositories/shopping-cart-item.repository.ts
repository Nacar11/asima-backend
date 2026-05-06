import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseShoppingCartItemRepository } from '../base-shopping-cart-item.repository';
import { ShoppingCartItemEntity } from '../entities/shopping-cart-item.entity';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { ShoppingCartItemMapper } from '../mappers/shopping-cart-item.mapper';

/**
 * Concrete implementation of shopping cart item repository.
 *
 * Handles database operations for shopping cart items using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ShoppingCartItemRepository extends BaseShoppingCartItemRepository {
  constructor(
    @InjectRepository(ShoppingCartItemEntity)
    private readonly repository: Repository<ShoppingCartItemEntity>,
  ) {
    super();
  }

  /**
   * Create a new shopping cart item.
   *
   * @param data - Shopping cart item domain model
   * @returns Promise<ShoppingCartItem> - Created item with variant details
   */
  async create(data: ShoppingCartItem): Promise<ShoppingCartItem> {
    const persistenceModel = ShoppingCartItemMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    // Fetch with relations based on item type
    const relations = ['created_by', 'updated_by'];
    if (data.item_type === 'product') {
      relations.push('variant', 'variant.product');
    } else if (data.item_type === 'service') {
      relations.push('service', 'package', 'service.seller', 'service_address');
    }

    const entityWithRelations = await this.repository.findOne({
      where: { id: newEntity.id },
      relations,
    });

    if (!entityWithRelations) {
      throw new Error('Failed to create shopping cart item');
    }

    return ShoppingCartItemMapper.toDomain(entityWithRelations);
  }

  /**
   * Find a cart item by ID.
   *
   * @param id - The cart item ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  async findById(id: number): Promise<ShoppingCartItem | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'variant',
        'variant.product',
        'variant.product.seller',
        'service',
        'package',
        'service.seller',
        'service_address',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entity ? ShoppingCartItemMapper.toDomain(entity) : null;
  }

  /**
   * Find a cart item by ID with the relations needed by cart page responses.
   *
   * @param id - The cart item ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  async findByIdForCartResponse(
    id: number,
  ): Promise<ShoppingCartItem | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'variant',
        'variant.product',
        'variant.product.seller',
        'variant.inventory_stock',
        'variant.media',
        'variant.product.product_media_mappings',
        'variant.product.product_media_mappings.media',
        'service',
        'package',
        'service.seller',
        'service_address',
        'cart_item_addons',
        'cart_item_addons.addon',
        'cart_item_options',
        'cart_item_options.option_group',
        'cart_item_options.option_value',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entity ? ShoppingCartItemMapper.toDomain(entity) : null;
  }

  /**
   * Find a cart item by cart ID and variant ID.
   *
   * Used to check if a variant already exists in the cart before adding.
   *
   * @param cartId - The shopping cart ID
   * @param variantId - The product variant ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  async findByCartAndVariant(
    cartId: number,
    variantId: number,
  ): Promise<ShoppingCartItem | null> {
    const entity = await this.repository.findOne({
      where: {
        shopping_cart_id: cartId,
        variant_id: variantId,
      },
      relations: ['variant', 'variant.product', 'variant.product.seller'],
    });

    return entity ? ShoppingCartItemMapper.toDomain(entity) : null;
  }

  /**
   * Find a cart item by cart ID, service ID, package ID, scheduled date, and scheduled time.
   *
   * Used to check if a service with the same scheduling already exists in the cart.
   *
   * @param cartId - The shopping cart ID
   * @param serviceId - The service ID
   * @param packageId - The service package ID (optional)
   * @param scheduledDate - The scheduled date
   * @param scheduledStartTime - The scheduled start time
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  async findByCartAndService(
    cartId: number,
    serviceId: number,
    packageId: number | null,
    scheduledDate: Date,
    scheduledStartTime: string,
  ): Promise<ShoppingCartItem | null> {
    const where: any = {
      shopping_cart_id: cartId,
      service_id: serviceId,
      scheduled_date: scheduledDate,
      scheduled_start_time: scheduledStartTime,
    };

    // Include package_id in the query if provided
    if (packageId !== null) {
      where.package_id = packageId;
    } else {
      where.package_id = null;
    }

    const entity = await this.repository.findOne({
      where,
      relations: ['service', 'package', 'service.seller', 'service_address'],
    });

    return entity ? ShoppingCartItemMapper.toDomain(entity) : null;
  }

  /**
   * Find all items for a specific cart.
   *
   * @param cartId - The shopping cart ID
   * @returns Promise<ShoppingCartItem[]> - Array of cart items
   */
  async findByCartId(cartId: number): Promise<ShoppingCartItem[]> {
    const entities = await this.repository.find({
      where: { shopping_cart_id: cartId },
      relations: [
        'variant',
        'variant.product',
        'variant.product.seller',
        'service',
        'package',
        'service.seller',
        'service_address',
      ],
    });

    return entities.map((entity) => ShoppingCartItemMapper.toDomain(entity));
  }

  /**
   * Update a shopping cart item.
   *
   * @param id - The cart item ID
   * @param payload - Partial item data to update
   * @returns Promise<ShoppingCartItem> - Updated item with variant details
   */
  async update(
    id: number,
    payload: Partial<ShoppingCartItem>,
  ): Promise<ShoppingCartItem> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Shopping cart item not found');
    }

    const updatedEntity = await this.repository.save(
      this.repository.create(
        ShoppingCartItemMapper.toPersistence({
          ...ShoppingCartItemMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    // Fetch with relations based on item type
    const relations = ['updated_by'];
    if (payload.item_type === 'product' || !payload.item_type) {
      relations.push('variant', 'variant.product');
    } else if (payload.item_type === 'service') {
      relations.push('service', 'package', 'service.seller', 'service_address');
    } else {
      // Fallback: load all relations
      relations.push(
        'variant',
        'variant.product',
        'service',
        'package',
        'service.seller',
        'service_address',
      );
    }

    const entityWithRelations = await this.repository.findOne({
      where: { id: updatedEntity.id },
      relations,
    });

    if (!entityWithRelations) {
      throw new Error('Failed to update shopping cart item');
    }

    return ShoppingCartItemMapper.toDomain(entityWithRelations);
  }

  /**
   * Soft delete a shopping cart item.
   *
   * @param id - The cart item ID
   * @returns Promise<void>
   */
  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Count total items in a cart (sum of all quantities).
   *
   * @param cartId - The shopping cart ID
   * @returns Promise<number> - Total item count
   */
  async countItemsInCart(cartId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('item')
      .select('SUM(item.quantity)', 'total')
      .where('item.shopping_cart_id = :cartId', { cartId })
      .andWhere('item.deleted_at IS NULL')
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  /**
   * Find multiple cart items by their IDs.
   *
   * @param ids - Array of cart item IDs
   * @returns Promise<ShoppingCartItem[]> - Array of found items
   */
  async findByIds(ids: number[]): Promise<ShoppingCartItem[]> {
    const entities = await this.repository.find({
      where: { id: In(ids) },
      relations: [
        'variant',
        'variant.product',
        'variant.product.seller',
        'service',
        'package',
        'service.seller',
        'service_address',
      ],
    });

    return entities.map((entity) => ShoppingCartItemMapper.toDomain(entity));
  }

  /**
   * Bulk update is_selected status for multiple cart items.
   *
   * @param ids - Array of cart item IDs to update
   * @param isSelected - The selection status to set
   * @param userId - The ID of the user performing the update
   * @returns Promise<number> - Number of items updated
   */
  async bulkUpdateSelection(
    ids: number[],
    isSelected: boolean,
    userId: number,
  ): Promise<number> {
    const result = await this.repository.update(
      { id: In(ids) },
      {
        is_selected: isSelected,
        updated_by: { id: userId } as any,
        updated_at: new Date(),
      },
    );

    return result.affected || 0;
  }

  /**
   * Bulk soft delete multiple cart items.
   *
   * @param ids - Array of cart item IDs to delete
   * @param userId - The ID of the user performing the deletion
   * @returns Promise<number> - Number of items deleted
   */
  async bulkSoftDelete(ids: number[], userId: number): Promise<number> {
    const result = await this.repository.update(
      { id: In(ids) },
      {
        deleted_by: { id: userId } as any,
        deleted_at: new Date(),
      },
    );

    return result.affected || 0;
  }
}
