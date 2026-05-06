import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  DataSource,
  DeepPartial,
} from 'typeorm';
import { AttributeEntity } from '../entities/attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { BaseAttributeRepository } from './base-attribute.repository';
import { Attribute } from '../../domain/attribute';
import { FindAllAttribute } from '../../domain/find-all-attribute';
import { CreateAttributeDto } from '../../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../../dto/update-attribute.dto';
import { QueryAttributeDto } from '../../dto/query-attribute.dto';
import { AttributeMapper } from '../mappers/attribute.mapper';
import { User } from '@/users/domain/user';

type CreateAttributeRepositoryInput = CreateAttributeDto & {
  seller_id: number;
  created_by: User;
  updated_by: User;
};

@Injectable()
export class AttributeRepository extends BaseAttributeRepository {
  constructor(
    @InjectRepository(AttributeEntity)
    private readonly attributeRepository: Repository<AttributeEntity>,
    @InjectRepository(AttributeValueEntity)
    private readonly attributeValueRepository: Repository<AttributeValueEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async create(attribute: CreateAttributeDto): Promise<Attribute> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        name,
        attribute_values,
        seller_id,
        created_by,
        updated_by,
        status,
      } = attribute as CreateAttributeRepositoryInput;
      const entity: AttributeEntity = this.attributeRepository.create({
        name,
        seller_id,
        created_by,
        updated_by,
        status,
      } as DeepPartial<AttributeEntity>);
      const savedEntity: AttributeEntity =
        await queryRunner.manager.save(entity);

      if (attribute_values && attribute_values.length > 0) {
        const attributeValueEntities = attribute_values.map((value, index) =>
          this.attributeValueRepository.create({
            attribute_id: savedEntity.id,
            value,
            display_order: index,
            created_by,
            updated_by,
          } as DeepPartial<AttributeValueEntity>),
        );
        await queryRunner.manager.save(
          AttributeValueEntity,
          attributeValueEntities,
        );
      }

      await queryRunner.commitTransaction();
      const savedWithRelations = await this.attributeRepository.findOne({
        where: { id: savedEntity.id },
        relations: [
          'created_by',
          'updated_by',
          'deleted_by',
          'attribute_values',
        ],
      });
      return AttributeMapper.toDomain(savedWithRelations || savedEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryAttributeDto,
    sellerId?: number | null,
  ): Promise<FindAllAttribute> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortOrder = query.sortBy || 'DESC';
    const { name, status } = query;

    const queryBuilder: SelectQueryBuilder<AttributeEntity> =
      this.attributeRepository
        .createQueryBuilder('attribute')
        .leftJoin(
          (subQuery) =>
            subQuery
              .select('pa.attribute_id', 'attribute_id')
              .addSelect('COUNT(DISTINCT pa.product_id)', 'count')
              .from('product_attributes', 'pa')
              .groupBy('pa.attribute_id'),
          'pa_counts',
          'pa_counts.attribute_id = attribute.id',
        )
        .addSelect('COALESCE(pa_counts.count, 0)', 'product_count')
        .addSelect('COUNT(*) OVER()', 'total_count')
        .leftJoinAndSelect('attribute.created_by', 'created_by')
        .leftJoinAndSelect('attribute.updated_by', 'updated_by')
        .leftJoinAndSelect('attribute.deleted_by', 'deleted_by')
        .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
        .where('attribute.deleted_at IS NULL')
        .andWhere('attribute.seller_id = :sellerId', { sellerId });

    if (name) {
      queryBuilder.andWhere('attribute.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('attribute.status = :status', { status });
    }

    queryBuilder
      .orderBy('attribute.created_at', sortOrder)
      .skip(skip)
      .take(take);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const totalCount = raw.length > 0 ? Number(raw[0]['total_count']) : 0;

    const productCountMap = new Map<number, number>();
    raw.forEach((row) => {
      const id: number = row.attribute_id;
      if (!productCountMap.has(id)) {
        productCountMap.set(id, Number(row.product_count ?? 0));
      }
    });

    return {
      data: entities.map((entity) => {
        const domain = AttributeMapper.toDomain(entity);
        domain.product_count = productCountMap.get(entity.id) ?? 0;
        return domain;
      }),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Attribute | null> {
    const entity = await this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoinAndSelect('attribute.created_by', 'created_by')
      .leftJoinAndSelect('attribute.updated_by', 'updated_by')
      .leftJoinAndSelect('attribute.deleted_by', 'deleted_by')
      .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
      .where('attribute.id = :id AND attribute.deleted_at IS NULL', { id })
      .orderBy('attribute_values.display_order', 'ASC')
      .getOne();

    return entity ? AttributeMapper.toDomain(entity) : null;
  }

  async update(id: number, attribute: UpdateAttributeDto): Promise<Attribute> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = await queryRunner.manager.findOne(AttributeEntity, {
        where: { id },
        relations: ['created_by', 'updated_by'],
      });

      if (!entity) {
        throw new NotFoundException(`Attribute with ID ${id} not found`);
      }

      const { attribute_values, ...parentUpdates } = attribute;

      Object.assign(entity, parentUpdates);
      const updatedEntity = await queryRunner.manager.save(entity);

      if (attribute_values) {
        await queryRunner.manager.delete(AttributeValueEntity, {
          attribute: { id: updatedEntity.id },
        });

        if (attribute_values.length > 0) {
          const newAttributeValues = attribute_values.map((val, index) => {
            return queryRunner.manager.create(AttributeValueEntity, {
              value: val,
              display_order: index,
              attribute: updatedEntity,
              created_by: entity.created_by,
              updated_by: entity.updated_by,
            });
          });

          await queryRunner.manager.save(
            AttributeValueEntity,
            newAttributeValues,
          );
        }
      }

      await queryRunner.commitTransaction();

      const finalEntity = await this.attributeRepository.findOne({
        where: { id: updatedEntity.id },
        relations: [
          'created_by',
          'updated_by',
          'deleted_by',
          'attribute_values',
        ],
        order: {
          attribute_values: { display_order: 'ASC' },
        },
      });

      if (!finalEntity) {
        throw new NotFoundException('Attribute not found after update');
      }

      return AttributeMapper.toDomain(finalEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    await this.attributeValueRepository.delete({ attribute_id: id });
    await this.attributeRepository.delete(id);
  }

  async countProductsByAttributeId(attributeId: number): Promise<number> {
    const result = await this.attributeRepository
      .createQueryBuilder('attr')
      .leftJoin('product_attributes', 'pa', 'pa.attribute_id = attr.id')
      .where('attr.id = :attributeId', { attributeId })
      .select('COUNT(DISTINCT pa.product_id)', 'count')
      .getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  async bulkSoftDelete(ids: number[], deletedBy: number): Promise<number> {
    const result = await this.attributeRepository
      .createQueryBuilder()
      .update()
      .set({
        deleted_by: { id: deletedBy } as any,
        deleted_at: () => 'NOW()',
      })
      .whereInIds(ids)
      .execute();
    return result.affected ?? 0;
  }
}
