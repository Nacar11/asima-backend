import { ProductAttributeValue } from '@/product-attribute-values/domain/product-attribute-value';
import { FindAllProductAttributeValue } from '@/product-attribute-values/domain/find-all-product-attribute-value';
import { QueryProductAttributeValueDto } from '@/product-attribute-values/dto/query-product-attribute-value.dto';

/**
 * Abstract base repository for ProductAttributeValue
 */
export abstract class BaseProductAttributeValueRepository {
  abstract create(data: ProductAttributeValue): Promise<ProductAttributeValue>;

  abstract findAll(
    query: QueryProductAttributeValueDto,
  ): Promise<FindAllProductAttributeValue>;

  abstract findById(id: number): Promise<ProductAttributeValue | null>;

  abstract update(
    id: number,
    data: Partial<ProductAttributeValue>,
  ): Promise<ProductAttributeValue>;

  abstract remove(id: number): Promise<void>;

  abstract setDefault(
    id: number,
    productAttributeId: number,
  ): Promise<ProductAttributeValue>;

  abstract findByIds(ids: number[]): Promise<ProductAttributeValue[]>;

  abstract bulkSetDefault(
    idsWithGroups: Array<{ id: number; productAttributeId: number }>,
  ): Promise<ProductAttributeValue[]>;
}
