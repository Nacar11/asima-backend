import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { MembershipPlanEntity } from '../entities/membership-plan.entity';
import { MembershipPlanMapper } from '../mappers/membership-plan.mapper';
import { MembershipPlan } from '../../domain/membership-plan';
import { QueryMembershipPlanDto } from '../../dto/query-membership-plan.dto';
import { FindAllMembershipPlan } from '../../domain/find-all-membership-plan';
import { BaseMembershipPlanRepository } from '../base-membership-plan.repository';
import { User } from '@/users/domain/user';

const MEMBERSHIP_PLAN_RELATIONS: string[] = [
  'membership_voucher_configurations',
];

/**
 * Concrete repository implementation for membership plans.
 */
@Injectable()
export class MembershipPlanRepository extends BaseMembershipPlanRepository {
  constructor(
    @InjectRepository(MembershipPlanEntity)
    private readonly repository: Repository<MembershipPlanEntity>,
  ) {
    super();
  }

  async create(data: MembershipPlan): Promise<MembershipPlan> {
    const persistenceModel = MembershipPlanMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    const entityWithRelations = await this.repository.findOne({
      where: { id: newEntity.id },
      relations: MEMBERSHIP_PLAN_RELATIONS,
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created membership plan');
    }
    return MembershipPlanMapper.toDomain(entityWithRelations);
  }

  async findAll(query: QueryMembershipPlanDto): Promise<FindAllMembershipPlan> {
    const skip = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take = query.take ?? PAGINATION_DEFAULTS.take;
    const sortOrder = query.sortBy ?? PAGINATION_DEFAULTS.sortOrder;

    const queryBuilder: SelectQueryBuilder<MembershipPlanEntity> =
      this.repository
        .createQueryBuilder('membership_plan')
        .where('membership_plan.deleted_at IS NULL');

    // Apply filters
    if (query.plan_code) {
      queryBuilder.andWhere('membership_plan.plan_code ILIKE :plan_code', {
        plan_code: `%${query.plan_code}%`,
      });
    }

    if (query.plan_name) {
      queryBuilder.andWhere('membership_plan.plan_name ILIKE :plan_name', {
        plan_name: `%${query.plan_name}%`,
      });
    }

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('membership_plan.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    // Apply sorting
    queryBuilder.orderBy('membership_plan.created_at', sortOrder);

    // Apply pagination and get results
    const [entities, totalCount] = await queryBuilder
      .orderBy('membership_plan.created_at', sortOrder)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    if (entities.length === 0) {
      return {
        data: [],
        totalCount,
        skip,
        take,
      };
    }

    const entityIds = entities.map((entity) => entity.id);
    const entitiesWithRelations = await this.repository.find({
      where: {
        id: In(entityIds),
      },
      relations: MEMBERSHIP_PLAN_RELATIONS,
    });
    const relationMap = new Map<number, MembershipPlanEntity>(
      entitiesWithRelations.map((entity) => [entity.id, entity]),
    );
    const data = entities.map((entity) =>
      MembershipPlanMapper.toDomain(relationMap.get(entity.id) ?? entity),
    );

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<MembershipPlan | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: MEMBERSHIP_PLAN_RELATIONS,
    });

    return entity && !entity.deleted_at
      ? MembershipPlanMapper.toDomain(entity)
      : null;
  }

  async update(
    id: number,
    data: Partial<MembershipPlan>,
  ): Promise<MembershipPlan> {
    const existingEntity = await this.repository.findOne({
      where: { id },
      relations: MEMBERSHIP_PLAN_RELATIONS,
    });
    if (!existingEntity || existingEntity.deleted_at) {
      throw new Error('Membership plan not found');
    }

    const sanitizedPayload: Partial<MembershipPlan> = { ...(data ?? {}) };
    delete sanitizedPayload.membership_voucher_configurations;
    delete sanitizedPayload.voucher_ids;
    delete sanitizedPayload.__entity;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        MembershipPlanMapper.toPersistence({
          ...MembershipPlanMapper.toDomain(existingEntity),
          ...sanitizedPayload,
        } as MembershipPlan),
      ),
    );

    const entityWithRelations = await this.repository.findOne({
      where: { id: updatedEntity.id },
      relations: MEMBERSHIP_PLAN_RELATIONS,
    });

    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated membership plan');
    }

    return MembershipPlanMapper.toDomain(entityWithRelations);
  }

  async remove(id: number, deletedBy?: User): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity || entity.deleted_at) {
      throw new Error('Membership plan not found');
    }

    if (deletedBy) {
      await this.repository.update(id, {
        deleted_by: deletedBy.id,
        updated_by: deletedBy.id,
      });
    }

    await this.repository.softDelete(id);
  }
}
