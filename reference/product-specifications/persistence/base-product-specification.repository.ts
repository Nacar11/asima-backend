import { ProductSpecification } from '../domain/product-specification';
import { FindAllProductSpecification } from '../domain/find-all-product-specification';
import { QueryProductSpecificationDto } from '../dto/query-product-specification.dto';

/**
 * Abstract repository for product specification persistence operations
 */
export abstract class BaseProductSpecificationRepository {
  abstract create(
    specification: ProductSpecification,
  ): Promise<ProductSpecification>;

  abstract findAll(
    query: QueryProductSpecificationDto,
  ): Promise<FindAllProductSpecification>;

  abstract findById(id: number): Promise<ProductSpecification | null>;

  abstract update(
    id: number,
    specification: Partial<ProductSpecification>,
  ): Promise<ProductSpecification>;

  abstract remove(id: number): Promise<void>;
}
