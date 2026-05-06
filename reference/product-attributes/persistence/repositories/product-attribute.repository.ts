import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductAttributeEntity } from '../entities/product-attribute.entity';
import { BaseProductAttributeRepository } from './base-product-attribute.repository';
import { ProductAttribute } from '../../domain/product-attribute';
import { FindAllProductAttribute } from '../../domain/find-all-product-attribute';
import { CreateProductAttributeDto } from '../../dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from '../../dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from '../../dto/query-product-attribute.dto';
import { ProductAttributeMapper } from '../mappers/product-attribute.mapper';

@Injectable()
export class ProductAttributeRepository extends BaseProductAttributeRepository {
  constructor(
    @InjectRepository(ProductAttributeEntity)
    private readonly productAttributeRepository: Repository<ProductAttributeEntity>,
  ) {
    super();
  }

  async create(
    productAttribute: CreateProductAttributeDto,
  ): Promise<ProductAttribute> {
    const entity = this.productAttributeRepository.create(productAttribute);
    const savedEntity = await this.productAttributeRepository.save(entity);
    return ProductAttributeMapper.toDomain(savedEntity);
  }

  async findAll(
    query: QueryProductAttributeDto,
  ): Promise<FindAllProductAttribute> {
    const { page = 1, limit = 10, product_id, attribute_id } = query;
    const skip = (page - 1) * limit;

    const queryBuilder: SelectQueryBuilder<ProductAttributeEntity> =
      this.productAttributeRepository
        .createQueryBuilder('productAttribute')
        .leftJoinAndSelect('productAttribute.product', 'product')
        .leftJoinAndSelect('productAttribute.attribute', 'attribute')
        .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
        .leftJoinAndSelect('productAttribute.created_by', 'created_by')
        .leftJoinAndSelect('productAttribute.updated_by', 'updated_by')
        .where('productAttribute.deleted_at IS NULL');

    if (product_id) {
      queryBuilder.andWhere('productAttribute.product_id = :product_id', {
        product_id,
      });
    }

    if (attribute_id) {
      queryBuilder.andWhere('productAttribute.attribute_id = :attribute_id', {
        attribute_id,
      });
    }

    const [data, totalCount] = await queryBuilder
      .orderBy('productAttribute.created_at', 'DESC')
      .addOrderBy('attribute_values.display_order', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map(ProductAttributeMapper.toDomain),
      totalCount,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<ProductAttribute | null> {
    const entity = await this.productAttributeRepository
      .createQueryBuilder('productAttribute')
      .leftJoinAndSelect('productAttribute.product', 'product')
      .leftJoinAndSelect('productAttribute.attribute', 'attribute')
      .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
      .leftJoinAndSelect('productAttribute.created_by', 'created_by')
      .leftJoinAndSelect('productAttribute.updated_by', 'updated_by')
      .leftJoinAndSelect('productAttribute.deleted_by', 'deleted_by')
      .where(
        'productAttribute.id = :id AND productAttribute.deleted_at IS NULL',
        { id },
      )
      .addOrderBy('attribute_values.display_order', 'ASC')
      .getOne();

    return entity ? ProductAttributeMapper.toDomain(entity) : null;
  }

  async findByProductAndAttribute(
    productId: number,
    attributeId: number,
    excludeId?: number,
  ): Promise<ProductAttribute | null> {
    const queryBuilder = this.productAttributeRepository
      .createQueryBuilder('productAttribute')
      .leftJoinAndSelect('productAttribute.product', 'product')
      .leftJoinAndSelect('productAttribute.attribute', 'attribute')
      .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
      .leftJoinAndSelect('productAttribute.created_by', 'created_by')
      .leftJoinAndSelect('productAttribute.updated_by', 'updated_by')
      .leftJoinAndSelect('productAttribute.deleted_by', 'deleted_by')
      .where(
        'productAttribute.product_id = :productId AND productAttribute.attribute_id = :attributeId AND productAttribute.deleted_at IS NULL',
        { productId, attributeId },
      );

    // Exclude current record when updating
    if (excludeId) {
      queryBuilder.andWhere('productAttribute.id != :excludeId', { excludeId });
    }

    const entity = await queryBuilder
      .addOrderBy('attribute_values.display_order', 'ASC')
      .getOne();

    return entity ? ProductAttributeMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    updateProductAttributeDto: UpdateProductAttributeDto,
  ): Promise<ProductAttribute> {
    // Convert User objects to IDs for the update
    const updateData: any = { ...updateProductAttributeDto };
    if (updateData.created_by && typeof updateData.created_by === 'object') {
      updateData.created_by = updateData.created_by.id;
    }
    if (updateData.updated_by && typeof updateData.updated_by === 'object') {
      updateData.updated_by = updateData.updated_by.id;
    }
    if (updateData.deleted_by && typeof updateData.deleted_by === 'object') {
      updateData.deleted_by = updateData.deleted_by.id;
    }

    await this.productAttributeRepository.update(id, updateData);

    const updatedEntity = await this.productAttributeRepository
      .createQueryBuilder('productAttribute')
      .leftJoinAndSelect('productAttribute.product', 'product')
      .leftJoinAndSelect('productAttribute.attribute', 'attribute')
      .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
      .leftJoinAndSelect('productAttribute.created_by', 'created_by')
      .leftJoinAndSelect('productAttribute.updated_by', 'updated_by')
      .leftJoinAndSelect('productAttribute.deleted_by', 'deleted_by')
      .where(
        'productAttribute.id = :id AND productAttribute.deleted_at IS NULL',
        { id },
      )
      .addOrderBy('attribute_values.display_order', 'ASC')
      .getOne();

    if (!updatedEntity) {
      throw new Error(`Product attribute with ID ${id} not found after update`);
    }

    return ProductAttributeMapper.toDomain(updatedEntity);
  }

  async hardDelete(id: number): Promise<void> {
    await this.productAttributeRepository.delete(id);
  }
}
