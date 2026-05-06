import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MembershipBillingPeriod } from './domain/membership-billing-period';
import { CreateMembershipBillingPeriodDto } from './dto/create-membership-billing-period.dto';
import { UpdateMembershipBillingPeriodDto } from './dto/update-membership-billing-period.dto';
import { QueryMembershipBillingPeriodDto } from './dto/query-membership-billing-period.dto';
import { FindAllMembershipBillingPeriod } from './domain/find-all-membership-billing-period';
import { BaseMembershipBillingPeriodRepository } from './persistence/base-membership-billing-period.repository';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { User } from '@/users/domain/user';

/**
 * Service for managing membership billing periods.
 */
@Injectable()
export class MembershipBillingPeriodsService {
  constructor(
    private readonly membershipBillingPeriodRepository: BaseMembershipBillingPeriodRepository,
    @InjectRepository(MembershipPlanBillingPeriodEntity)
    private readonly membershipPlanBillingPeriodRepository: Repository<MembershipPlanBillingPeriodEntity>,
  ) {}

  /**
   * Create a new membership billing period.
   */
  async create(
    input: CreateMembershipBillingPeriodDto,
    causer: User,
  ): Promise<MembershipBillingPeriod> {
    const billingPeriod = new MembershipBillingPeriod();
    Object.assign(billingPeriod, input);

    // Set defaults
    billingPeriod.sort_order = input.sort_order ?? 0;
    billingPeriod.is_active =
      input.is_active !== undefined ? input.is_active : true;

    // Set audit fields
    billingPeriod.created_by = causer.id;
    billingPeriod.updated_by = causer.id;

    return this.membershipBillingPeriodRepository.create(billingPeriod);
  }

  /**
   * Find all membership billing periods with filters and pagination.
   */
  async findAll(
    query: QueryMembershipBillingPeriodDto,
  ): Promise<FindAllMembershipBillingPeriod> {
    return this.membershipBillingPeriodRepository.findAll(query);
  }

  /**
   * Find membership billing period by ID.
   */
  async findById(id: number): Promise<MembershipBillingPeriod> {
    const billingPeriod =
      await this.membershipBillingPeriodRepository.findById(id);

    if (!billingPeriod) {
      throw new NotFoundException('Membership billing period not found');
    }

    return billingPeriod;
  }

  /**
   * Update membership billing period.
   */
  async update(
    id: number,
    input: UpdateMembershipBillingPeriodDto,
    causer: User,
  ): Promise<MembershipBillingPeriod> {
    // Verify billing period exists
    await this.findById(id);

    // Set audit field
    const updateData = {
      ...input,
      updated_by: causer.id,
    };

    return this.membershipBillingPeriodRepository.update(id, updateData);
  }

  /**
   * Soft delete membership billing period and cascade soft-delete
   * all linked membership_plan_billing_period rows.
   */
  async delete(id: number, causer: User): Promise<void> {
    // Verify billing period exists
    await this.findById(id);

    // Cascade soft-delete all linked plan billing period rows
    const planBillingPeriodRows =
      await this.membershipPlanBillingPeriodRepository.find({
        where: { billing_period_id: id, deleted_at: IsNull() },
      });

    if (planBillingPeriodRows.length > 0) {
      const removeIds = planBillingPeriodRows.map((row) => row.id);
      await this.membershipPlanBillingPeriodRepository.update(removeIds, {
        deleted_by: { id: causer.id } as any,
      });
      await this.membershipPlanBillingPeriodRepository.softRemove(
        planBillingPeriodRows,
      );
    }

    return this.membershipBillingPeriodRepository.remove(id, causer);
  }
}
