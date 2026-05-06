import { ProductAttribute } from '../../domain/product-attribute';
import { FindAllProductAttribute } from '../../domain/find-all-product-attribute';
import { CreateProductAttributeDto } from '../../dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from '../../dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from '../../dto/query-product-attribute.dto';

export abstract class BaseProductAttributeRepository {
  abstract create(
    productAttribute: CreateProductAttributeDto,
  ): Promise<ProductAttribute>;

  abstract findAll(
    query: QueryProductAttributeDto,
  ): Promise<FindAllProductAttribute>;

  abstract findById(id: number): Promise<ProductAttribute | null>;

  abstract findByProductAndAttribute(
    productId: number,
    attributeId: number,
    excludeId?: number,
  ): Promise<ProductAttribute | null>;

  abstract update(
    id: number,
    updateProductAttributeDto: UpdateProductAttributeDto,
  ): Promise<ProductAttribute>;

  abstract hardDelete(id: number): Promise<void>;
}
