import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductVariantRepository } from './persistence/repositories/product-variant.repository';
import { ProductVariant } from './domain/product-variant';
import { FindAllProductVariant } from './domain/find-all-product-variant';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { SyncProductVariantsDto } from './dto/sync-product-variants.dto';
import { User } from '@/users/domain/user';
import { DataSource } from 'typeorm';
import { In } from 'typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { ProductAttributeValueEntity } from '@/product-attribute-values/persistence/entities/product-attribute-value.entity';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { ProductVariantEntity } from './persistence/entities/product-variant.entity';
import { ProductVariantMapper } from './persistence/mappers/product-variant.mapper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { FeaturedProductsCacheService } from '@/featured-products/featured-products-cache.service';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly repository: ProductVariantRepository,
    private readonly dataSource: DataSource,
    private readonly featuredProductsCacheService: FeaturedProductsCacheService,
  ) {}

  private buildVariantDeleteForbiddenMessage(variantName: string): string {
    return `${variantName} has existing orders, unable to update/delete.`;
  }

  /**
   * Helper method to compare two arrays for equality
   * @param arr1 First array
   * @param arr2 Second array
   * @returns True if arrays are equal
   */
  private arraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  async findAll(query: QueryProductVariantDto): Promise<FindAllProductVariant> {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ProductVariant> {
    const variant = await this.repository.findById(id);
    if (!variant) {
      throw new NotFoundException(`Product variant with ID ${id} not found`);
    }
    return variant;
  }

  async delete(id: number, causer: User): Promise<void> {
    const existingVariant = await this.repository.findById(id);
    if (!existingVariant) {
      throw new NotFoundException(`Product variant with ID ${id} not found`);
    }

    // Get the product to check ownership
    const product = await this.dataSource.manager.findOne(ProductEntity, {
      where: { id: existingVariant.product_id },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${existingVariant.product_id} not found`,
      );
    }

    // Check if user owns this product or is system admin
    const seller = await this.dataSource.manager.findOne(SellerEntity, {
      where: { id: product.seller_id, user_id: causer.id },
    });

    if (!seller && !causer.system_admin) {
      throw new ForbiddenException(
        'You can only delete product variants for your own products',
      );
    }

    // Perform hard delete to remove all associated records
    await this.hardDeleteProductVariant(id);
  }

  /**
   * Hard delete product variant and all associated records
   */
  private async hardDeleteProductVariant(id: number): Promise<void> {
    // Execute deletions in a transaction
    await this.dataSource.transaction(async (transactionManager) => {
      // 1. Delete product attribute values (depends on product variant)
      await transactionManager
        .createQueryBuilder()
        .delete()
        .from('product_attribute_values')
        .where('product_variant_id = :variantId', { variantId: id })
        .execute();

      // 2. Delete inventory stock (depends on product variant)
      await transactionManager
        .createQueryBuilder()
        .delete()
        .from('inventory_stocks')
        .where('variant_id = :variantId', { variantId: id })
        .execute();

      // 3. Delete the product variant itself
      await transactionManager
        .createQueryBuilder()
        .delete()
        .from('product_variants')
        .where('id = :id', { id })
        .execute();
    });
  }

  async syncVariants(
    productId: number,
    input: SyncProductVariantsDto,
    causer: User,
  ): Promise<ProductVariant[]> {
    // Validate that the product exists
    const product = await this.dataSource.manager.findOne(ProductEntity, {
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if user owns this product or is system admin
    const seller = await this.dataSource.manager.findOne(SellerEntity, {
      where: { id: product.seller_id, user_id: causer.id },
    });

    if (!seller && !causer.system_admin) {
      throw new ForbiddenException(
        'You can only sync product variants for your own products',
      );
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const existingVariants = await manager.find(ProductVariantEntity, {
        where: { product_id: productId },
        select: { id: true, sku: true },
      });
      const existingDefaultByProductAttributeId = new Map<number, number>();
      if (existingVariants.length > 0) {
        const variantIds = existingVariants.map((v) => v.id);
        const existingDefaultRows: Array<{
          product_attribute_id: number;
          attribute_value_id: number;
        }> = await manager
          .createQueryBuilder(ProductAttributeValueEntity, 'pav')
          .select('pav.product_attribute_id', 'product_attribute_id')
          .addSelect('pav.attribute_value_id', 'attribute_value_id')
          .where('pav.product_variant_id IN (:...variantIds)', { variantIds })
          .andWhere('pav.is_default = true')
          .andWhere('pav.deleted_at IS NULL')
          .getRawMany();
        existingDefaultRows.forEach((row) => {
          if (
            !existingDefaultByProductAttributeId.has(row.product_attribute_id)
          ) {
            existingDefaultByProductAttributeId.set(
              row.product_attribute_id,
              row.attribute_value_id,
            );
          }
        });
      }
      const inputSkus = new Set<string>(
        input.product_variants.map((v) => v.sku),
      );
      const variantsToDelete = existingVariants
        .filter((existingVariant) => !inputSkus.has(existingVariant.sku))
        .map((existingVariant) => existingVariant.id);
      if (variantsToDelete.length > 0) {
        const blockingOrderRows: Array<{ variant_id: number }> = await manager
          .createQueryBuilder(SalesOrderItemEntity, 'sales_order_item')
          .select('sales_order_item.variant_id', 'variant_id')
          .innerJoin(
            SalesOrderEntity,
            'sales_order',
            'sales_order.id = sales_order_item.order_id',
          )
          .where('sales_order_item.variant_id IN (:...variantIds)', {
            variantIds: variantsToDelete,
          })
          .andWhere('sales_order_item.item_type = :itemType', {
            itemType: CartItemTypeEnum.PRODUCT,
          })
          .andWhere('sales_order_item.deleted_at IS NULL')
          .andWhere('sales_order.deleted_at IS NULL')
          .groupBy('sales_order_item.variant_id')
          .getRawMany();
        if (blockingOrderRows.length > 0) {
          const blockedVariantIds = blockingOrderRows.map((row) =>
            Number(row.variant_id),
          );
          const blockedVariants = await manager.find(ProductVariantEntity, {
            where: { id: In(blockedVariantIds) },
            select: { id: true, variant_name: true },
          });
          const blockedVariantNames = blockedVariants
            .map((variant) => variant.variant_name)
            .filter(
              (name) => typeof name === 'string' && name.trim().length > 0,
            );
          const message =
            blockedVariantNames.length > 0
              ? blockedVariantNames
                  .map((name) => this.buildVariantDeleteForbiddenMessage(name))
                  .join('\n')
              : 'Unable to update/delete, this product variant has existing orders.';
          throw new ForbiddenException(message);
        }
        await manager.delete(ProductAttributeValueEntity, {
          product_variant_id: In(variantsToDelete),
        });
        await manager.delete(InventoryStockEntity, {
          variant_id: In(variantsToDelete),
        });
        await manager.delete(ProductVariantEntity, {
          id: In(variantsToDelete),
        });
      }
      if (input.product_variants.length === 0) {
        return [];
      }

      // Pre-validate for duplicate SKUs within the same sync request
      const skuSet = new Set<string>();
      for (let index = 0; index < input.product_variants.length; index++) {
        const dto = input.product_variants[index];
        const variantIndex = index + 1;

        if (skuSet.has(dto.sku)) {
          throw new BadRequestException(
            `Variant ${variantIndex}: Duplicate SKU '${dto.sku}' found within the same sync request. SKUs must be unique across all variants.`,
          );
        }
        skuSet.add(dto.sku);
      }

      // Pre-validate for duplicate attribute_value_ids combinations
      const attributeCombinationSet = new Set<string>();
      for (let index = 0; index < input.product_variants.length; index++) {
        const dto = input.product_variants[index];
        const variantIndex = index + 1;

        if (dto.attribute_value_ids && dto.attribute_value_ids.length > 0) {
          const sortedIds = [...dto.attribute_value_ids].sort((a, b) => a - b);
          const combinationKey = sortedIds.join(',');

          if (attributeCombinationSet.has(combinationKey)) {
            throw new BadRequestException(
              `Variant ${variantIndex}: Duplicate attribute value combination [${sortedIds.join(', ')}] found. Each variant must have a unique combination of attribute values.`,
            );
          }
          attributeCombinationSet.add(combinationKey);
        }
      }

      const syncedVariants: ProductVariant[] = [];

      // Step 3: Process each variant using recycled create logic
      for (let index = 0; index < input.product_variants.length; index++) {
        const dto = input.product_variants[index];
        const variantIndex = index + 1; // Use 1-based index for user-friendly messages

        const displayOrder = dto.display_order ?? variantIndex;

        // Set the product_id for the variant
        const variantDto = {
          ...dto,
          product_id: productId,
          display_order: displayOrder,
        };
        const existingVariant = await manager.findOne(ProductVariantEntity, {
          where: { sku: dto.sku },
          select: { id: true, product_id: true },
        });
        if (existingVariant && existingVariant.product_id !== productId) {
          throw new BadRequestException(
            `Variant ${variantIndex} (SKU: '${dto.sku}'): SKU already exists. Product variant SKUs must be unique across all products.`,
          );
        }

        // Get all product attributes for this product
        const productAttributes = await manager.find(ProductAttributeEntity, {
          where: { product_id: productId },
        });

        // Validate attribute value IDs count matches product attributes count
        if (!dto.attribute_value_ids || dto.attribute_value_ids.length === 0) {
          throw new BadRequestException(
            `Variant ${variantIndex}: Attribute value IDs are required`,
          );
        }

        if (dto.attribute_value_ids.length !== productAttributes.length) {
          throw new BadRequestException(
            `Variant ${variantIndex}: Attribute value IDs count (${dto.attribute_value_ids.length}) must match product attributes count (${productAttributes.length})`,
          );
        }

        // Validate each attribute value belongs to a product attribute
        const productAttributeIds = productAttributes.map(
          (pa) => pa.attribute_id,
        );

        // Collect all allowed attribute value IDs from all product attributes
        const allowedAttributeValueIds = new Set<number>();
        for (const pa of productAttributes) {
          if (pa.attribute_value_ids) {
            pa.attribute_value_ids.forEach((id) =>
              allowedAttributeValueIds.add(id),
            );
          }
        }

        const validatedAttributeMappings: Array<{
          attribute_value_id: number;
          product_attribute_id: number;
        }> = [];
        const usedAttributeIds = new Set<number>();

        for (const attributeValueId of dto.attribute_value_ids) {
          // Validate that the attribute value ID is in the allowed list
          if (!allowedAttributeValueIds.has(attributeValueId)) {
            throw new BadRequestException(
              `Variant ${variantIndex}: Attribute value ID ${attributeValueId} is not in the allowed list for this product's attributes`,
            );
          }

          // Get the attribute value to find its attribute_id
          const attrValue = await manager.findOne(AttributeValueEntity, {
            where: { id: attributeValueId },
          });

          if (!attrValue) {
            throw new NotFoundException(
              `Variant ${variantIndex}: Attribute value with ID ${attributeValueId} not found`,
            );
          }

          // Check if this attribute value's attribute belongs to the product
          if (!productAttributeIds.includes(attrValue.attribute_id)) {
            throw new BadRequestException(
              `Variant ${variantIndex}: Attribute value ID ${attributeValueId} (attribute ID ${attrValue.attribute_id}) does not belong to product ID ${productId}`,
            );
          }

          // Check for duplicate attributes in the request
          if (usedAttributeIds.has(attrValue.attribute_id)) {
            throw new BadRequestException(
              `Variant ${variantIndex}: Duplicate attribute ID ${attrValue.attribute_id} found in attribute value IDs (attribute value ID ${attributeValueId})`,
            );
          }
          usedAttributeIds.add(attrValue.attribute_id);

          // Find the corresponding product attribute for this attribute value
          const productAttribute = productAttributes.find(
            (pa) => pa.attribute_id === attrValue.attribute_id,
          );

          if (!productAttribute) {
            throw new BadRequestException(
              `Variant ${variantIndex}: No product attribute found for attribute ID ${attrValue.attribute_id} in product ID ${productId}`,
            );
          }

          // Store the mapping for later use
          validatedAttributeMappings.push({
            attribute_value_id: attributeValueId,
            product_attribute_id: productAttribute.id,
          });
        }

        // Create the product variant using repository create method
        const domainModel = new ProductVariant();
        Object.assign(domainModel, variantDto);
        domainModel.minimum_order = dto.minimum_order ?? 1;
        domainModel.display_order = displayOrder;
        domainModel.status = dto.status ?? 'Active';
        if (!existingVariant) {
          domainModel.created_by = causer;
        }
        domainModel.updated_by = causer;

        const variantEntity = manager.create(ProductVariantEntity, {
          ...ProductVariantMapper.toPersistence(domainModel),
          id: existingVariant?.id,
        });
        const savedVariant = await manager.save(
          ProductVariantEntity,
          variantEntity,
        );
        await manager.delete(ProductAttributeValueEntity, {
          product_variant_id: savedVariant.id,
        });
        await manager.delete(InventoryStockEntity, {
          variant_id: savedVariant.id,
        });

        // Create associated product attribute values
        const attributeValueEntities = validatedAttributeMappings.map(
          (mapping) => {
            const entity = new ProductAttributeValueEntity();
            entity.product_variant_id = savedVariant.id;
            entity.product_attribute_id = mapping.product_attribute_id;
            entity.attribute_value_id = mapping.attribute_value_id;
            const existingDefaultAttributeValueId =
              existingDefaultByProductAttributeId.get(
                mapping.product_attribute_id,
              );
            entity.is_default =
              existingDefaultAttributeValueId !== undefined &&
              existingDefaultAttributeValueId === mapping.attribute_value_id;
            entity.created_by = causer.id;
            entity.updated_by = causer.id;
            return entity;
          },
        );

        await manager.save(ProductAttributeValueEntity, attributeValueEntities);

        // Create inventory stock for the product variant
        const stockQuantity = dto.stock_quantity ?? 0;
        const reservedQuantity = dto.reserved_quantity ?? 0;
        const availableQuantity = Math.max(0, stockQuantity - reservedQuantity);
        const stockOnHand = dto.stock_on_hand ?? 0;

        const inventoryStockEntity = manager.create(InventoryStockEntity, {
          variant_id: savedVariant.id,
          stock_on_hand: stockOnHand,
          available_quantity: availableQuantity,
          stock_quantity: stockQuantity,
          reserved_quantity: reservedQuantity,
          min_stock_level: dto.min_stock_level ?? 0,
          created_by: { id: causer.id } as any,
          updated_by: { id: causer.id } as any,
        });

        await manager.save(InventoryStockEntity, inventoryStockEntity);

        // Fetch the complete variant with all relationships
        const completeVariant = await manager.findOne(ProductVariantEntity, {
          where: { id: savedVariant.id },
          relations: [
            'product_attribute_values',
            'product_attribute_values.attribute_value',
            'product_attribute_values.attribute_value.attribute',
            'inventory_stock',
            'product',
            'created_by',
            'updated_by',
          ],
        });

        if (completeVariant) {
          syncedVariants.push(ProductVariantMapper.toDomain(completeVariant));
        }
      }

      return syncedVariants;
    });

    // Invalidate featured products cache if this product is featured (prices may have changed)
    await this.featuredProductsCacheService.invalidateIfFeatured(productId);

    return result;
  }
}
