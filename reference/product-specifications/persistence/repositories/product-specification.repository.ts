import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BaseProductSpecificationRepository } from '@/product-specifications/persistence/base-product-specification.repository';
import { ProductSpecificationEntity } from '@/product-specifications/persistence/entities/product-specification.entity';
import { ProductSpecificationMapper } from '@/product-specifications/persistence/mappers/product-specification.mapper';
import { ProductSpecification } from '@/product-specifications/domain/product-specification';
import { FindAllProductSpecification } from '@/product-specifications/domain/find-all-product-specification';
import { QueryProductSpecificationDto } from '@/product-specifications/dto/query-product-specification.dto';

/**
 * Concrete repository for product specification persistence operations
 */
@Injectable()
export class ProductSpecificationRepository extends BaseProductSpecificationRepository {
  constructor(
    @InjectRepository(ProductSpecificationEntity)
    private readonly specificationRepository: Repository<ProductSpecificationEntity>,
  ) {
    super();
  }

  async create(data: ProductSpecification): Promise<ProductSpecification> {
    const persistenceModel = ProductSpecificationMapper.toPersistence(data);

    const newEntity = await this.specificationRepository.save(
      this.specificationRepository.create(persistenceModel),
    );

    return ProductSpecificationMapper.toDomain(newEntity);
  }

  async findAll(
    query: QueryProductSpecificationDto,
  ): Promise<FindAllProductSpecification> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProductSpecificationEntity> = {};

    if (query.product_id !== undefined) {
      where.product_id = query.product_id;
    }

    if (query.specification_name) {
      where.specification_name = ILike(`%${query.specification_name}%`);
    }

    const [entities, totalCount] =
      await this.specificationRepository.findAndCount({
        where,
        relations: ['created_by', 'updated_by', 'deleted_by'],
        order: {
          sort_order: 'ASC',
        },
        skip,
        take: limit,
      });

    return {
      data: entities.map((entity) =>
        ProductSpecificationMapper.toDomain(entity),
      ),
      totalCount,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<ProductSpecification | null> {
    const entity = await this.specificationRepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? ProductSpecificationMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ProductSpecification>,
  ): Promise<ProductSpecification> {
    const entity = await this.specificationRepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    if (!entity) {
      throw new Error('Product specification not found');
    }

    const updatedEntity = await this.specificationRepository.save(
      this.specificationRepository.create(
        ProductSpecificationMapper.toPersistence({
          ...ProductSpecificationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    const entityWithRelations = await this.specificationRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated product specification');
    }
    return ProductSpecificationMapper.toDomain(entityWithRelations);
  }

  async remove(id: number): Promise<void> {
    await this.specificationRepository.delete(id);
  }
}
