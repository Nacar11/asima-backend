import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';
import { SubscriptionPlanMapper } from '@/subscription-plans/persistence/mappers/subscription-plan.mapper';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { QuerySubscriptionPlanDto } from '@/subscription-plans/dto/query-subscription-plan.dto';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { DeepPartial } from 'typeorm';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';

@Injectable()
export class SubscriptionPlanRepository
  implements BaseSubscriptionPlanRepository
{
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly repository: Repository<SubscriptionPlanEntity>,
  ) {}

  async create(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const persistenceModel = SubscriptionPlanMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return SubscriptionPlanMapper.toDomain(newEntity);
  }

  async findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionPlanDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubscriptionPlan>> {
    const { filterQuery, paginationOptions } = params;
    const { page, limit } = paginationOptions;

    const queryBuilder = this.repository.createQueryBuilder('plan');

    if (filterQuery?.search) {
      const searchTerm = `%${filterQuery.search}%`;
      // Check if search is a number (for price search)
      const searchAsNumber = parseFloat(filterQuery.search);
      const isNumericSearch =
        !isNaN(searchAsNumber) && isFinite(searchAsNumber);

      queryBuilder.andWhere(
        `(
          plan.plan_name ILIKE :search OR 
          plan.plan_code ILIKE :search OR 
          CAST(plan.plan_type AS TEXT) ILIKE :search OR 
          CAST(plan.billing_cycle AS TEXT) ILIKE :search OR
          CAST(plan.price AS TEXT) ILIKE :search
          ${isNumericSearch ? 'OR plan.price = :searchNumber' : ''}
        )`,
        isNumericSearch
          ? { search: searchTerm, searchNumber: searchAsNumber }
          : { search: searchTerm },
      );
    }

    if (filterQuery?.status) {
      queryBuilder.andWhere('plan.status = :status', {
        status: filterQuery.status,
      });
    }

    if (filterQuery?.plan_type) {
      queryBuilder.andWhere('plan.plan_type = :plan_type', {
        plan_type: filterQuery.plan_type,
      });
    }

    if (filterQuery?.billing_cycle) {
      queryBuilder.andWhere('plan.billing_cycle = :billing_cycle', {
        billing_cycle: filterQuery.billing_cycle,
      });
    }

    // Apply sorting
    const sortField = filterQuery?.sortField || 'display_order';
    const sortBy = filterQuery?.sortBy || 'ASC';
    queryBuilder.orderBy(`plan.${sortField}`, sortBy);

    // Secondary sort for consistency
    if (sortField !== 'display_order') {
      queryBuilder.addOrderBy('plan.display_order', 'ASC');
    }
    // Always add id as tertiary sort for consistent ordering (id is not a valid sortField option)
    queryBuilder.addOrderBy('plan.id', 'DESC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map(SubscriptionPlanMapper.toDomain),
      totalResults: totalCount,
    };
  }

  async findById(id: number): Promise<NullableType<SubscriptionPlan>> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? SubscriptionPlanMapper.toDomain(entity) : null;
  }

  async findByCode(plan_code: string): Promise<NullableType<SubscriptionPlan>> {
    const entity = await this.repository.findOne({
      where: { plan_code },
    });

    return entity ? SubscriptionPlanMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<SubscriptionPlan[]> {
    const entities = await this.repository.find({
      where: { id: In(ids) },
    });

    return entities.map(SubscriptionPlanMapper.toDomain);
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    const entities = await this.repository.find({
      where: { status: PlanStatusEnum.ACTIVE },
      order: { display_order: 'ASC', id: 'DESC' },
    });

    return entities.map(SubscriptionPlanMapper.toDomain);
  }

  async update(
    id: number,
    payload: DeepPartial<SubscriptionPlan>,
  ): Promise<SubscriptionPlan> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription plan does not exist!');
    }

    const updateData = SubscriptionPlanMapper.toPersistence({
      ...SubscriptionPlanMapper.toDomain(entity),
      ...payload,
    } as SubscriptionPlan);

    const updatedEntity = await this.repository.save(
      this.repository.create(updateData),
    );

    return SubscriptionPlanMapper.toDomain(updatedEntity);
  }

  async remove(id: number, causer: User): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Subscription plan does not exist!');
    }

    const transactionManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      await manager.update(
        SubscriptionPlanEntity,
        { id: entity.id },
        {
          status: PlanStatusEnum.INACTIVE,
          updated_by: causerEntity,
          deleted_by: causerEntity,
        },
      );
      await manager.softDelete(SubscriptionPlanEntity, { id: entity.id });
    });
  }

  async lookup(loadOptions: LookUpDto): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('plan');

    queryBuilder.where('plan.status = :status', {
      status: PlanStatusEnum.ACTIVE,
    });

    if (loadOptions.searchValue) {
      queryBuilder.andWhere(
        '(plan.plan_name ILIKE :search OR plan.plan_code ILIKE :search)',
        { search: `%${loadOptions.searchValue}%` },
      );
    }

    queryBuilder.orderBy('plan.display_order', 'ASC').take(loadOptions.take);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) => ({
        id: entity.id,
        code: entity.plan_code,
        name: entity.plan_name,
      })),
      totalCount,
    };
  }
}
