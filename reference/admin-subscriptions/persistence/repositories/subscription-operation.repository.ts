import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionOperationEntity } from '../entities/subscription-operation.entity';
import { SubscriptionOperation } from '@/admin-subscriptions/domain/subscription-operation';
import { SubscriptionOperationMapper } from '../mappers/subscription-operation.mapper';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Repository for subscription operations.
 *
 * Handles database operations for subscription operations using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SubscriptionOperationRepository {
  constructor(
    @InjectRepository(SubscriptionOperationEntity)
    private readonly repository: Repository<SubscriptionOperationEntity>,
  ) {}

  async create(
    operation: Omit<SubscriptionOperation, 'id' | 'performed_at' | 'performer'>,
  ): Promise<SubscriptionOperation> {
    const persistenceEntity = SubscriptionOperationMapper.toPersistence(
      operation as SubscriptionOperation,
    );
    const savedEntity = await this.repository.save(persistenceEntity);

    const entity = await this.repository.findOne({
      where: { id: savedEntity.id },
      relations: ['performer', 'subscription'],
    });

    if (!entity) {
      throw new Error('Failed to create subscription operation');
    }

    return SubscriptionOperationMapper.toDomain(entity);
  }

  async findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SubscriptionOperation[]> {
    const entities = await this.repository.find({
      where: { subscription_id: subscriptionId },
      relations: ['performer', 'subscription'],
      order: { performed_at: 'DESC' },
    });

    return entities.map((entity) =>
      SubscriptionOperationMapper.toDomain(entity),
    );
  }

  async findAll(options: {
    filterQuery?: {
      subscriptionId?: number;
      operationType?: SubscriptionOperationTypeEnum;
    };
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubscriptionOperation>> {
    const { paginationOptions, filterQuery } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('operation')
      .leftJoinAndSelect('operation.performer', 'performer')
      .leftJoinAndSelect('operation.subscription', 'subscription');

    if (filterQuery?.subscriptionId) {
      queryBuilder.andWhere('operation.subscription_id = :subscriptionId', {
        subscriptionId: filterQuery.subscriptionId,
      });
    }

    if (filterQuery?.operationType) {
      queryBuilder.andWhere('operation.operation_type = :operationType', {
        operationType: filterQuery.operationType,
      });
    }

    queryBuilder
      .orderBy('operation.performed_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) =>
        SubscriptionOperationMapper.toDomain(entity),
      ),
      totalResults: total,
    };
  }
}
