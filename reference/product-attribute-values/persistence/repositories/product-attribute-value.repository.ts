import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttributeValueEntity } from '../entities/product-attribute-value.entity';
import { BaseProductAttributeValueRepository } from './base-product-attribute-value.repository';
import { ProductAttributeValue } from '@/product-attribute-values/domain/product-attribute-value';
import { FindAllProductAttributeValue } from '@/product-attribute-values/domain/find-all-product-attribute-value';
import { QueryProductAttributeValueDto } from '@/product-attribute-values/dto/query-product-attribute-value.dto';
import { ProductAttributeValueMapper } from '../mappers/product-attribute-value.mapper';

@Injectable()
export class ProductAttributeValueRepository extends BaseProductAttributeValueRepository {
  constructor(
    @InjectRepository(ProductAttributeValueEntity)
    private readonly repository: Repository<ProductAttributeValueEntity>,
  ) {
    super();
  }

  async create(data: ProductAttributeValue): Promise<ProductAttributeValue> {
    const entity = ProductAttributeValueMapper.toPersistence(data);
    const saved = await this.repository.save(entity);
    return ProductAttributeValueMapper.toDomain(saved);
  }

  async findAll(
    query: QueryProductAttributeValueDto,
  ): Promise<FindAllProductAttributeValue> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const queryBuilder = this.repository
      .createQueryBuilder('pav')
      .where('pav.deleted_at IS NULL');
    if (query.product_variant_id !== undefined) {
      queryBuilder.andWhere('pav.product_variant_id = :product_variant_id', {
        product_variant_id: query.product_variant_id,
      });
    }
    if (query.product_attribute_id !== undefined) {
      queryBuilder.andWhere(
        'pav.product_attribute_id = :product_attribute_id',
        { product_attribute_id: query.product_attribute_id },
      );
    }
    if (query.attribute_value_id !== undefined) {
      queryBuilder.andWhere('pav.attribute_value_id = :attribute_value_id', {
        attribute_value_id: query.attribute_value_id,
      });
    }
    queryBuilder.orderBy('pav.created_at', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [entities, totalCount] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map(ProductAttributeValueMapper.toDomain),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<ProductAttributeValue | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    if (!entity) {
      return null;
    }
    return ProductAttributeValueMapper.toDomain(entity);
  }

  async update(
    id: number,
    data: Partial<ProductAttributeValue>,
  ): Promise<ProductAttributeValue> {
    await this.repository.update(id, data as any);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(
        `ProductAttributeValue with ID ${id} not found`,
      );
    }
    return ProductAttributeValueMapper.toDomain(updated);
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async setDefault(
    id: number,
    productAttributeId: number,
  ): Promise<ProductAttributeValue> {
    await this.repository
      .createQueryBuilder()
      .update(ProductAttributeValueEntity)
      .set({ is_default: false })
      .where('product_attribute_id = :productAttributeId', {
        productAttributeId,
      })
      .andWhere('deleted_at IS NULL')
      .execute();
    await this.repository
      .createQueryBuilder()
      .update(ProductAttributeValueEntity)
      .set({ is_default: true })
      .where('id = :id', { id })
      .execute();
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(
        `ProductAttributeValue with ID ${id} not found`,
      );
    }
    return ProductAttributeValueMapper.toDomain(updated);
  }

  async findByIds(ids: number[]): Promise<ProductAttributeValue[]> {
    if (ids.length === 0) {
      return [];
    }
    const entities = await this.repository
      .createQueryBuilder('pav')
      .where('pav.id IN (:...ids)', { ids })
      .andWhere('pav.deleted_at IS NULL')
      .getMany();
    return entities.map(ProductAttributeValueMapper.toDomain);
  }

  async bulkSetDefault(
    idsWithGroups: Array<{ id: number; productAttributeId: number }>,
  ): Promise<ProductAttributeValue[]> {
    if (idsWithGroups.length === 0) {
      return [];
    }
    const groupIds = idsWithGroups.map((item) => item.productAttributeId);
    await this.repository
      .createQueryBuilder()
      .update(ProductAttributeValueEntity)
      .set({ is_default: false })
      .where('product_attribute_id IN (:...groupIds)', { groupIds })
      .andWhere('deleted_at IS NULL')
      .execute();
    const targetIds = idsWithGroups.map((item) => item.id);
    await this.repository
      .createQueryBuilder()
      .update(ProductAttributeValueEntity)
      .set({ is_default: true })
      .where('id IN (:...targetIds)', { targetIds })
      .execute();
    const updated = await this.repository
      .createQueryBuilder('pav')
      .where('pav.id IN (:...targetIds)', { targetIds })
      .getMany();
    return updated.map(ProductAttributeValueMapper.toDomain);
  }
}
