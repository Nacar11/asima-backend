import { ProductVariant } from '@/product-variants/domain/product-variant';
import { FindAllProductVariant } from '@/product-variants/domain/find-all-product-variant';
import { QueryProductVariantDto } from '@/product-variants/dto/query-product-variant.dto';

export abstract class BaseProductVariantRepository {
  /**
   * Find all product variants with filtering and pagination
   * @param query Query parameters
   * @returns Paginated product variants
   */
  abstract findAll(
    query: QueryProductVariantDto,
  ): Promise<FindAllProductVariant>;

  /**
   * Find product variant by ID
   * @param id Product variant ID
   * @returns Product variant or null if not found
   */
  abstract findById(id: number): Promise<ProductVariant | null>;

  /**
   * Find product variant by SKU
   * @param sku Product variant SKU
   * @returns Product variant or null if not found
   */
  abstract findBySku(sku: string): Promise<ProductVariant | null>;

  /**
   * Find a product variant by ID with all relationships loaded
   * @param id Product variant ID
   * @returns Product variant with relationships or null
   */
  abstract findByIdWithRelationships(
    id: number,
  ): Promise<ProductVariant | null>;

  /**
   * Find all product variants for a specific product
   * @param productId Product ID
   * @returns Array of product variants
   */
  abstract findByProductId(productId: number): Promise<ProductVariant[]>;

  /**
   * Find product variant with the lowest cost price for a specific product
   * @param productId Product ID
   * @returns Product variant with lowest cost price or null if not found
   */
  abstract findVariantWithLowestCostPrice(
    productId: number,
  ): Promise<ProductVariant | null>;

  /**
   * Soft delete product variant
   * @param id Product variant ID
   * @returns Promise
   */
  abstract remove(id: number): Promise<void>;
}
