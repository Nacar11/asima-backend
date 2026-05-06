import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { Subscription } from '@/subscriptions/domain/subscription';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';
import { SubscriptionMapper } from '@/subscriptions/persistence/mappers/subscription.mapper';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { QuerySubscriptionDto } from '@/subscriptions/dto/query-subscription.dto';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { DeepPartial } from 'typeorm';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

@Injectable()
export class SubscriptionRepository implements BaseSubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async create(data: Partial<Subscription>): Promise<Subscription> {
    const persistenceModel = SubscriptionMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return SubscriptionMapper.toDomain(newEntity);
  }

  async findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Subscription>> {
    const { filterQuery, paginationOptions } = params;
    const { page, limit } = paginationOptions;

    const queryBuilder = this.repository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.user', 'user');

    if (filterQuery?.search) {
      const searchTerm = `%${filterQuery.search}%`;
      queryBuilder.andWhere(
        `(
          subscription.subscription_number ILIKE :search OR 
          user.first_name ILIKE :search OR 
          user.last_name ILIKE :search OR
          plan.plan_name ILIKE :search
        )`,
        { search: searchTerm },
      );
    }

    if (filterQuery?.status) {
      queryBuilder.andWhere('subscription.status = :status', {
        status: filterQuery.status,
      });
    }

    if (filterQuery?.user_id) {
      queryBuilder.andWhere('subscription.user_id = :user_id', {
        user_id: filterQuery.user_id,
      });
    }

    if (filterQuery?.plan_id) {
      queryBuilder.andWhere('subscription.plan_id = :plan_id', {
        plan_id: filterQuery.plan_id,
      });
    }

    // Apply sorting
    const sortField = filterQuery?.sortField || 'id';
    const sortBy = filterQuery?.sortBy || 'DESC';
    queryBuilder.orderBy(`subscription.${sortField}`, sortBy);

    // Always add id as secondary sort for consistent ordering
    if (sortField !== 'id') {
      queryBuilder.addOrderBy('subscription.id', 'DESC');
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map(SubscriptionMapper.toDomain),
      totalResults: totalCount,
    };
  }

  async findById(id: number): Promise<NullableType<Subscription>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['plan', 'user'],
    });

    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByNumber(
    subscription_number: string,
  ): Promise<NullableType<Subscription>> {
    const entity = await this.repository.findOne({
      where: { subscription_number },
      relations: ['plan', 'user'],
    });

    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByUserId(user_id: number): Promise<Subscription[]> {
    const entities = await this.repository.find({
      where: { user_id },
      relations: ['plan'],
      order: { id: 'DESC' },
    });

    return entities.map(SubscriptionMapper.toDomain);
  }

  async findActiveByUserId(
    user_id: number,
  ): Promise<NullableType<Subscription>> {
    // Find subscription with ACTIVE or PENDING_PAYMENT status
    // Prioritize ACTIVE subscriptions, but also return PENDING_PAYMENT
    // First try to find an ACTIVE subscription
    let entity = await this.repository.findOne({
      where: { user_id, status: SubscriptionStatusEnum.ACTIVE },
      relations: ['plan'],
    });

    // If no active subscription, find a PENDING_PAYMENT one
    if (!entity) {
      entity = await this.repository.findOne({
        where: { user_id, status: SubscriptionStatusEnum.PENDING_PAYMENT },
        relations: ['plan'],
        order: { id: 'DESC' }, // Get the most recent pending subscription
      });
    }

    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: DeepPartial<Subscription>,
  ): Promise<Subscription> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription does not exist!');
    }

    const updateData = SubscriptionMapper.toPersistence({
      ...SubscriptionMapper.toDomain(entity),
      ...payload,
    } as Subscription);

    const updatedEntity = await this.repository.save(
      this.repository.create(updateData),
    );

    return SubscriptionMapper.toDomain(updatedEntity);
  }

  async remove(id: number, causer: User): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription does not exist!');
    }

    const transactionManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      await manager.update(
        SubscriptionEntity,
        { id: entity.id },
        {
          status: SubscriptionStatusEnum.CANCELLED,
          updated_by: causerEntity,
          deleted_by: causerEntity,
        },
      );
      await manager.softDelete(SubscriptionEntity, { id: entity.id });
    });
  }
}
