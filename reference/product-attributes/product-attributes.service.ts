import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from './domain/product-attribute';
import { FindAllProductAttribute } from './domain/find-all-product-attribute';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';
import { BaseProductAttributeRepository } from './persistence/repositories/base-product-attribute.repository';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { BaseAttributeRepository } from '@/attributes/persistence/repositories/base-attribute.repository';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { User } from '@/users/domain/user';

@Injectable()
export class ProductAttributesService {
  constructor(
    private readonly productAttributeRepository: BaseProductAttributeRepository,
    private readonly productRepository: BaseProductRepository,
    private readonly attributeRepository: BaseAttributeRepository,
    @InjectRepository(AttributeValueEntity)
    private readonly attributeValueRepository: Repository<AttributeValueEntity>,
  ) {}

  async create(
    createProductAttributeDto: CreateProductAttributeDto,
    causer: User,
  ): Promise<ProductAttribute> {
    await this.validateProductAttributeData(
      createProductAttributeDto.product_id,
      createProductAttributeDto.attribute_id,
      createProductAttributeDto.attribute_value_ids || [],
      causer.seller_id,
    );

    // Check if product-attribute combination already exists
    await this.validateUniqueProductAttribute(
      createProductAttributeDto.product_id,
      createProductAttributeDto.attribute_id,
    );

    const productAttribute = {
      ...createProductAttributeDto,
      created_by: causer,
      updated_by: causer,
    };
    return this.productAttributeRepository.create(productAttribute);
  }

  async findAll(
    query: QueryProductAttributeDto,
  ): Promise<FindAllProductAttribute> {
    return this.productAttributeRepository.findAll(query);
  }

  async findById(id: number): Promise<ProductAttribute> {
    const productAttribute = await this.productAttributeRepository.findById(id);
    if (!productAttribute) {
      throw new NotFoundException(`Product attribute with ID ${id} not found`);
    }
    return productAttribute;
  }

  async update(
    id: number,
    updateProductAttributeDto: UpdateProductAttributeDto,
    causer: User,
  ): Promise<ProductAttribute> {
    const existingProductAttribute = await this.findById(id);
    // If attribute_value_ids is provided, validate it
    if (updateProductAttributeDto.attribute_value_ids !== undefined) {
      await this.validateProductAttributeData(
        existingProductAttribute.product_id,
        existingProductAttribute.attribute_id,
        updateProductAttributeDto.attribute_value_ids || [],
        causer.seller_id,
      );
    }

    // If product_id or attribute_id is being updated, validate them too
    const newProductId =
      updateProductAttributeDto.product_id ??
      existingProductAttribute.product_id;
    const newAttributeId =
      updateProductAttributeDto.attribute_id ??
      existingProductAttribute.attribute_id;

    // Check if the new combination already exists (excluding current record)
    if (
      newProductId !== existingProductAttribute.product_id ||
      newAttributeId !== existingProductAttribute.attribute_id
    ) {
      if (updateProductAttributeDto.product_id !== undefined) {
        await this.validateProductOwnership(
          updateProductAttributeDto.product_id,
          causer.seller_id,
        );
      }
      if (updateProductAttributeDto.attribute_id !== undefined) {
        await this.validateAttributeOwnership(
          updateProductAttributeDto.attribute_id,
          causer.seller_id,
        );
      }

      await this.validateUniqueProductAttribute(
        newProductId,
        newAttributeId,
        id, // Exclude current record from uniqueness check
      );
    }

    return this.productAttributeRepository.update(id, {
      ...updateProductAttributeDto,
    });
  }

  async delete(id: number): Promise<void> {
    if (!id) {
      throw new Error('ID is required for delete operation');
    }

    // Check if product attribute exists (will throw NotFoundException if not found)
    await this.findById(id);

    // Perform hard delete
    await this.productAttributeRepository.hardDelete(id);
  }

  private async validateProductAttributeData(
    productId: number,
    attributeId: number,
    attributeValueIds: number[],
    sellerId: number | null | undefined,
  ): Promise<void> {
    // Validate product ownership
    await this.validateProductOwnership(productId, sellerId);

    // Validate attribute ownership
    await this.validateAttributeOwnership(attributeId, sellerId);

    // Validate attribute value IDs
    await this.validateAttributeValueIds(
      attributeValueIds,
      attributeId,
      sellerId,
    );
  }

  private async validateProductOwnership(
    productId: number,
    sellerId: number | null | undefined,
  ): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    if (product.seller_id !== sellerId) {
      throw new NotFoundException(
        `Product with ID ${productId} not found here`,
      );
    }
  }

  private async validateAttributeOwnership(
    attributeId: number,
    sellerId: number | null | undefined,
  ): Promise<void> {
    const attribute = await this.attributeRepository.findById(attributeId);
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${attributeId} not found`);
    }
    if (attribute.seller_id !== sellerId) {
      throw new NotFoundException(`Attribute with ID ${attributeId} not found`);
    }
  }

  private async validateAttributeValueIds(
    attributeValueIds: number[],
    attributeId: number,
    sellerId: number | null | undefined,
  ): Promise<void> {
    if (!attributeValueIds || attributeValueIds.length === 0) {
      return; // Empty array is valid
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(attributeValueIds);
    if (uniqueIds.size !== attributeValueIds.length) {
      throw new BadRequestException(
        'Duplicate attribute value IDs are not allowed',
      );
    }

    // Validate each attribute value belongs to the correct attribute and seller
    for (const valueId of attributeValueIds) {
      const attributeValue = await this.attributeValueRepository.findOne({
        where: { id: valueId },
      });
      if (!attributeValue) {
        throw new BadRequestException(
          `Attribute value with ID ${valueId} not found`,
        );
      }

      // Get the attribute to verify it belongs to the seller
      const attribute = await this.attributeRepository.findById(
        attributeValue.attribute_id,
      );
      if (!attribute) {
        throw new BadRequestException(
          `Attribute with ID ${attributeValue.attribute_id} not found`,
        );
      }

      // Verify the attribute value belongs to the expected attribute
      if (attributeValue.attribute_id !== attributeId) {
        throw new BadRequestException(
          `Attribute value with ID ${valueId} does not belong to attribute with ID ${attributeId}`,
        );
      }

      // Verify the attribute belongs to the current seller
      if (attribute.seller_id !== sellerId) {
        throw new BadRequestException(
          `Attribute value with ID ${valueId} does not belong to your attributes`,
        );
      }
    }
  }

  private async validateUniqueProductAttribute(
    productId: number,
    attributeId: number,
    excludeId?: number,
  ): Promise<void> {
    const existingProductAttribute =
      await this.productAttributeRepository.findByProductAndAttribute(
        productId,
        attributeId,
        excludeId,
      );

    if (existingProductAttribute) {
      throw new BadRequestException(`Product attribute already exists`);
    }
  }
}
