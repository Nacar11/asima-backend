import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPlanEntity } from '@/membership-plans/persistence/entities/membership-plan.entity';
import { BaseMembershipRepository } from '@/memberships/persistence/base-membership.repository';
import { Membership } from '@/memberships/domain/membership';
import { MembershipMapper } from '@/memberships/persistence/mappers/membership.mapper';
import { QueryMembershipDto } from '@/memberships/dto/query-membership.dto';
import { FindAllMembership } from '@/memberships/domain/find-all-membership';
import { NullableType } from '@/utils/types/nullable.type';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipListItem } from '@/memberships/domain/membership-list-item';

@Injectable()
export class MembershipRepository implements BaseMembershipRepository {
  constructor(
    @InjectRepository(MembershipEntity)
    private readonly repository: Repository<MembershipEntity>,
  ) {}
  async create(data: Partial<Membership>): Promise<Membership> {
    const persistenceModel: MembershipEntity =
      MembershipMapper.toPersistence(data);
    const newEntity: MembershipEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return MembershipMapper.toDomain(newEntity);
  }
  async findAll(query: QueryMembershipDto): Promise<FindAllMembership> {
    const skip: number = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = query.take ?? PAGINATION_DEFAULTS.take;
    const queryBuilder: SelectQueryBuilder<MembershipEntity> =
      this.buildMembershipListQuery(query);
    queryBuilder.orderBy('membership.id', 'DESC').skip(skip).take(take);
    const [entities, totalCount]: [MembershipEntity[], number] =
      await queryBuilder.getManyAndCount();
    const membershipIds: number[] = entities.map(
      (entity: MembershipEntity): number => entity.id,
    );
    const revenueMap: Record<number, number> =
      await this.getRevenueByMembershipIds(membershipIds);
    const membersCount: number = await this.getMembersCount(query);
    const activeMembers: number = await this.getActiveMembersCount(query);
    const totalRevenue: number = await this.getTotalRevenue(query);
    const cancelledMembers: number = await this.getCancelledMembersCount(query);
    const churnRate: number =
      membersCount > 0
        ? Number(((cancelledMembers / membersCount) * 100).toFixed(2))
        : 0;
    return {
      data: entities.map((entity: MembershipEntity): MembershipListItem => {
        const membership: Membership = MembershipMapper.toDomain(entity);
        const fullName: string =
          `${entity.user?.first_name ?? ''} ${entity.user?.last_name ?? ''}`.trim();
        return {
          ...membership,
          member_name: fullName,
          member_email: entity.user?.email ?? '',
          revenue: revenueMap[entity.id] ?? 0,
          renewal_date: membership.ends_at ?? null,
        };
      }),
      totalCount,
      skip,
      take,
      members_count: membersCount,
      active_members: activeMembers,
      total_revenue: totalRevenue,
      churn_rate: churnRate,
    };
  }

  private buildMembershipListQuery(
    query: QueryMembershipDto,
  ): SelectQueryBuilder<MembershipEntity> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> = this.repository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.user', 'user')
      .leftJoinAndMapOne(
        'membership.membership_plan',
        MembershipPlanEntity,
        'membership_plan',
        'membership_plan.id = membership.membership_plan_id',
      );
    if (query.search) {
      queryBuilder.andWhere(
        "(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search) OR LOWER(CONCAT(user.first_name, ' ', user.last_name)) LIKE LOWER(:search))",
        { search: `%${query.search}%` },
      );
    }
    if (query.user_id !== undefined) {
      queryBuilder.andWhere('membership.user_id = :user_id', {
        user_id: query.user_id,
      });
    }
    if (query.status) {
      queryBuilder.andWhere('membership.status = :status', {
        status: query.status,
      });
    }
    if (query.membership_plan_billing_period_id) {
      queryBuilder.andWhere(
        'membership.membership_plan_billing_period_id = :membership_plan_billing_period_id',
        {
          membership_plan_billing_period_id:
            query.membership_plan_billing_period_id,
        },
      );
    }
    if (query.start_date) {
      queryBuilder.andWhere('membership.starts_at >= :startDate', {
        startDate: query.start_date,
      });
    }
    if (query.end_date) {
      queryBuilder.andWhere('membership.starts_at <= :endDate', {
        endDate: query.end_date,
      });
    }
    return queryBuilder;
  }

  private buildMembershipMetricsQuery(
    query: QueryMembershipDto,
  ): SelectQueryBuilder<MembershipEntity> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> = this.repository
      .createQueryBuilder('membership')
      .leftJoin('membership.user', 'user');
    if (query.search) {
      queryBuilder.andWhere(
        "(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search) OR LOWER(CONCAT(user.first_name, ' ', user.last_name)) LIKE LOWER(:search))",
        { search: `%${query.search}%` },
      );
    }
    if (query.user_id !== undefined) {
      queryBuilder.andWhere('membership.user_id = :user_id', {
        user_id: query.user_id,
      });
    }
    if (query.membership_plan_billing_period_id) {
      queryBuilder.andWhere(
        'membership.membership_plan_billing_period_id = :membership_plan_billing_period_id',
        {
          membership_plan_billing_period_id:
            query.membership_plan_billing_period_id,
        },
      );
    }
    if (query.status) {
      queryBuilder.andWhere('membership.status = :status', {
        status: query.status,
      });
    }
    if (query.start_date) {
      queryBuilder.andWhere('membership.starts_at >= :startDate', {
        startDate: query.start_date,
      });
    }
    if (query.end_date) {
      queryBuilder.andWhere('membership.starts_at <= :endDate', {
        endDate: query.end_date,
      });
    }
    return queryBuilder;
  }

  private async getRevenueByMembershipIds(
    membershipIds: number[],
  ): Promise<Record<number, number>> {
    if (membershipIds.length === 0) {
      return {};
    }
    const rows: Array<{ membership_id: string; revenue: string }> =
      await this.repository.manager
        .getRepository(MembershipPaymentEntity)
        .createQueryBuilder('membership_payment')
        .select('membership_payment.membership_id', 'membership_id')
        .addSelect('COALESCE(SUM(membership_payment.amount), 0)', 'revenue')
        .where('membership_payment.membership_id IN (:...membershipIds)', {
          membershipIds,
        })
        .andWhere('membership_payment.payment_status = :paymentStatus', {
          paymentStatus: MembershipPaymentStatusEnum.PAID,
        })
        .groupBy('membership_payment.membership_id')
        .getRawMany();
    const revenueByMembershipId: Record<number, number> = {};
    rows.forEach((row: { membership_id: string; revenue: string }): void => {
      revenueByMembershipId[Number(row.membership_id)] = Number(row.revenue);
    });
    return revenueByMembershipId;
  }

  private async getMembersCount(query: QueryMembershipDto): Promise<number> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> =
      this.buildMembershipMetricsQuery(query);
    return queryBuilder.getCount();
  }

  private async getActiveMembersCount(
    query: QueryMembershipDto,
  ): Promise<number> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> =
      this.buildMembershipMetricsQuery(query);
    queryBuilder.andWhere('membership.status = :activeStatus', {
      activeStatus: MembershipStatusEnum.ACTIVE,
    });
    return queryBuilder.getCount();
  }

  private async getCancelledMembersCount(
    query: QueryMembershipDto,
  ): Promise<number> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> =
      this.buildMembershipMetricsQuery(query);
    queryBuilder.andWhere('membership.status = :cancelledStatus', {
      cancelledStatus: MembershipStatusEnum.CANCELLED,
    });
    return queryBuilder.getCount();
  }

  private async getTotalRevenue(query: QueryMembershipDto): Promise<number> {
    const queryBuilder: SelectQueryBuilder<MembershipEntity> =
      this.buildMembershipMetricsQuery(query)
        .leftJoin(
          MembershipPaymentEntity,
          'membership_payment',
          'membership_payment.membership_id = membership.id',
        )
        .andWhere('membership_payment.payment_status = :paymentStatus', {
          paymentStatus: MembershipPaymentStatusEnum.PAID,
        })
        .select('COALESCE(SUM(membership_payment.amount), 0)', 'totalRevenue');
    const rawResult: { totalRevenue: string } | undefined =
      await queryBuilder.getRawOne();
    return Number(rawResult?.totalRevenue ?? 0);
  }
  async findById(id: number): Promise<NullableType<Membership>> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: { id },
    });
    return entity ? MembershipMapper.toDomain(entity) : null;
  }
  async findLatestByUserId(userId: number): Promise<NullableType<Membership>> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: { user_id: userId },
      order: { id: 'DESC' },
    });
    return entity ? MembershipMapper.toDomain(entity) : null;
  }
  async findActiveByUserId(userId: number): Promise<NullableType<Membership>> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: { user_id: userId, status: MembershipStatusEnum.ACTIVE },
      order: { id: 'DESC' },
    });
    return entity ? MembershipMapper.toDomain(entity) : null;
  }

  async findActiveOrGraceByUserId(
    userId: number,
  ): Promise<NullableType<Membership>> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: {
        user_id: userId,
        status: In([MembershipStatusEnum.ACTIVE, MembershipStatusEnum.GRACE_PERIOD]),
      },
      order: { id: 'DESC' },
    });
    return entity ? MembershipMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: DeepPartial<Membership>,
  ): Promise<Membership> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException('Membership does not exist.');
    }
    const updateData: MembershipEntity = MembershipMapper.toPersistence({
      ...MembershipMapper.toDomain(entity),
      ...payload,
    } as Membership);
    const updatedEntity: MembershipEntity = await this.repository.save(
      this.repository.create(updateData),
    );
    return MembershipMapper.toDomain(updatedEntity);
  }
  async remove(id: number, causer: User): Promise<void> {
    const entity: MembershipEntity | null = await this.repository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException('Membership does not exist.');
    }
    const transactionManager: EntityManager = this.repository.manager;
    const causerEntity = UserMapper.toPersistence(causer);
    await transactionManager.transaction(
      async (manager: EntityManager): Promise<void> => {
        await manager.update(
          MembershipEntity,
          { id: entity.id },
          { updated_by: causerEntity, deleted_by: causerEntity },
        );
        await manager.softDelete(MembershipEntity, { id: entity.id });
      },
    );
  }
}
