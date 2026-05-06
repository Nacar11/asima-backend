import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipBillingPeriodMapper } from '../mappers/membership-billing-period.mapper';
import { MembershipBillingPeriod } from '../../domain/membership-billing-period';
import { QueryMembershipBillingPeriodDto } from '../../dto/query-membership-billing-period.dto';
import { FindAllMembershipBillingPeriod } from '../../domain/find-all-membership-billing-period';
import { BaseMembershipBillingPeriodRepository } from '../base-membership-billing-period.repository';
import { User } from '@/users/domain/user';

/**
 * Concrete repository implementation for membership billing periods.
 */
@Injectable()
export class MembershipBillingPeriodRepository extends BaseMembershipBillingPeriodRepository {
  constructor(
    @InjectRepository(MembershipBillingPeriodEntity)
    private readonly repository: Repository<MembershipBillingPeriodEntity>,
  ) {
    super();
  }

  async create(
    data: MembershipBillingPeriod,
  ): Promise<MembershipBillingPeriod> {
    const persistenceModel = MembershipBillingPeriodMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    return MembershipBillingPeriodMapper.toDomain(newEntity);
  }

  async findAll(
    query: QueryMembershipBillingPeriodDto,
  ): Promise<FindAllMembershipBillingPeriod> {
    const skip = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take = query.take ?? PAGINATION_DEFAULTS.take;
    const sortOrder = query.sortBy ?? PAGINATION_DEFAULTS.sortOrder;

    const queryBuilder: SelectQueryBuilder<MembershipBillingPeriodEntity> =
      this.repository
        .createQueryBuilder('billing_period')
        .where('billing_period.deleted_at IS NULL');

    // Apply filters
    if (query.period_code) {
      queryBuilder.andWhere('billing_period.period_code ILIKE :period_code', {
        period_code: `%${query.period_code}%`,
      });
    }

    if (query.period_name) {
      queryBuilder.andWhere('billing_period.period_name ILIKE :period_name', {
        period_name: `%${query.period_name}%`,
      });
    }

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('billing_period.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    // Apply sorting and pagination
    const [entities, totalCount] = await queryBuilder
      .orderBy('billing_period.created_at', sortOrder)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const data = entities.map((entity) =>
      MembershipBillingPeriodMapper.toDomain(entity),
    );

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<MembershipBillingPeriod | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity || entity.deleted_at) {
      return null;
    }

    return MembershipBillingPeriodMapper.toDomain(entity);
  }

  async update(
    id: number,
    data: Partial<MembershipBillingPeriod>,
  ): Promise<MembershipBillingPeriod> {
    const existingEntity = await this.repository.findOne({
      where: { id },
    });
    if (!existingEntity || existingEntity.deleted_at) {
      throw new Error('Membership billing period not found');
    }

    const sanitizedPayload: Partial<MembershipBillingPeriod> = {
      ...(data ?? {}),
    };
    delete sanitizedPayload.__entity;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        MembershipBillingPeriodMapper.toPersistence({
          ...MembershipBillingPeriodMapper.toDomain(existingEntity),
          ...sanitizedPayload,
        } as MembershipBillingPeriod),
      ),
    );

    return MembershipBillingPeriodMapper.toDomain(updatedEntity);
  }

  async remove(id: number, deletedBy?: User): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity || entity.deleted_at) {
      throw new Error('Membership billing period not found');
    }

    if (deletedBy) {
      await this.repository.update(id, {
        deleted_by: { id: deletedBy.id },
        updated_by: { id: deletedBy.id },
      } as any);
    }

    await this.repository.softDelete(id);
  }
}
