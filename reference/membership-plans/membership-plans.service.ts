import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MembershipPlan, PlanBillingPeriod } from './domain/membership-plan';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { QueryMembershipPlanDto } from './dto/query-membership-plan.dto';
import { FindAllMembershipPlan } from './domain/find-all-membership-plan';
import { BaseMembershipPlanRepository } from './persistence/base-membership-plan.repository';
import { User } from '@/users/domain/user';
import { MembershipVoucherConfigurationsService } from '@/membership-voucher-configurations/membership-voucher-configurations.service';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { BillingPeriodPlanItemDto } from './dto/billing-period-plan-item.dto';

/**
 * Service for managing membership plans.
 */
@Injectable()
export class MembershipPlansService {
  constructor(
    private readonly membershipPlanRepository: BaseMembershipPlanRepository,
    private readonly membershipVoucherConfigurationsService: MembershipVoucherConfigurationsService,
    @InjectRepository(MembershipPlanBillingPeriodEntity)
    private readonly membershipPlanBillingPeriodRepository: Repository<MembershipPlanBillingPeriodEntity>,
  ) {}

  /**
   * Create a new membership plan.
   */
  async create(
    input: CreateMembershipPlanDto,
    causer: User,
  ): Promise<MembershipPlan> {
    const { voucher_ids, billing_periods, ...planInput } = input;
    const membershipPlan = new MembershipPlan();
    Object.assign(membershipPlan, planInput);

    // Set defaults
    membershipPlan.is_active =
      input.is_active !== undefined ? input.is_active : true;

    // Set audit fields
    membershipPlan.created_by = causer.id;
    membershipPlan.updated_by = causer.id;

    const createdPlan =
      await this.membershipPlanRepository.create(membershipPlan);

    if (voucher_ids !== undefined) {
      await this.syncVoucherConfigurations(createdPlan.id, voucher_ids, causer);
    }

    if (billing_periods !== undefined) {
      await this.syncBillingPeriods(createdPlan.id, billing_periods, causer);
    }

    return this.findById(createdPlan.id);
  }

  /**
   * Find all membership plans with filters and pagination.
   */
  async findAll(query: QueryMembershipPlanDto): Promise<FindAllMembershipPlan> {
    const result = await this.membershipPlanRepository.findAll(query);

    if (result.data.length > 0) {
      const planIds = result.data.map((plan) => plan.id);

      const monthlyRows = await this.membershipPlanBillingPeriodRepository
        .createQueryBuilder('mpbp')
        .innerJoinAndSelect('mpbp.billing_period', 'bp')
        .where('mpbp.membership_plan_id IN (:...planIds)', { planIds })
        .andWhere('mpbp.deleted_at IS NULL')
        .andWhere('bp.duration_in_months = :months', { months: 1 })
        .getMany();

      const monthlyPriceMap = new Map<number, number>(
        monthlyRows.map((row) => [
          row.membership_plan_id,
          Number(row.total_price),
        ]),
      );

      for (const plan of result.data) {
        plan.monthly_price = monthlyPriceMap.get(plan.id) ?? null;
      }
    }

    return result;
  }

  /**
   * Find membership plan by ID, including active billing period pricing entries.
   */
  async findById(id: number): Promise<MembershipPlan> {
    const membershipPlan = await this.membershipPlanRepository.findById(id);

    if (!membershipPlan) {
      throw new NotFoundException('Membership plan not found');
    }

    const billingPeriodRows =
      await this.membershipPlanBillingPeriodRepository.find({
        where: { membership_plan_id: id, deleted_at: IsNull() },
        relations: ['billing_period'],
        order: { billing_period: { sort_order: 'ASC' } },
      });

    const monthlyRow = billingPeriodRows.find(
      (row) => row.billing_period?.duration_in_months === 1,
    );
    membershipPlan.monthly_price = monthlyRow
      ? Number(monthlyRow.total_price)
      : null;

    membershipPlan.plan_billing_periods = billingPeriodRows.map(
      (row): PlanBillingPeriod => ({
        id: row.id,
        billing_period_id: row.billing_period_id,
        total_price: Number(row.total_price),
        discount_percentage: Number(row.discount_percentage),
        is_active: row.is_active,
        billing_period: row.billing_period
          ? {
              id: row.billing_period.id,
              period_code: row.billing_period.period_code,
              period_name: row.billing_period.period_name,
              duration_in_months: row.billing_period.duration_in_months,
              duration_in_days: row.billing_period.duration_in_days,
              sort_order: row.billing_period.sort_order,
              is_active: row.billing_period.is_active,
            }
          : undefined,
      }),
    );

    return membershipPlan;
  }

  /**
   * Update membership plan.
   */
  async update(
    id: number,
    input: UpdateMembershipPlanDto,
    causer: User,
  ): Promise<MembershipPlan> {
    // Verify membership plan exists
    await this.findById(id);

    const { voucher_ids, billing_periods, ...planUpdates } = input;
    const updateData = {
      ...planUpdates,
      updated_by: causer.id,
    };

    const updatedPlan = await this.membershipPlanRepository.update(
      id,
      updateData,
    );

    if (voucher_ids !== undefined) {
      await this.syncVoucherConfigurations(id, voucher_ids, causer);
    }

    if (billing_periods !== undefined) {
      await this.syncBillingPeriods(id, billing_periods, causer);
    }

    return this.findById(updatedPlan.id);
  }

  private async syncVoucherConfigurations(
    membershipPlanId: number,
    voucherIds: number[],
    causer: User,
  ): Promise<void> {
    const distinctVoucherIds = Array.from(new Set(voucherIds ?? []));
    const existing = await this.membershipVoucherConfigurationsService.findAll({
      membership_plan_id: membershipPlanId,
      skip: 0,
      take: 1000,
    });

    const existingMap = new Map<number, MembershipVoucherConfiguration>(
      existing.data.map((config) => [config.voucher_id, config]),
    );
    const targetSet = new Set(distinctVoucherIds);

    const removals = existing.data.filter(
      (config) => !targetSet.has(config.voucher_id),
    );
    await Promise.all(
      removals.map((config) =>
        this.membershipVoucherConfigurationsService.remove(config.id, causer),
      ),
    );

    const additions = distinctVoucherIds.filter(
      (voucherId) => !existingMap.has(voucherId),
    );
    await Promise.all(
      additions.map((voucherId) =>
        this.membershipVoucherConfigurationsService.create(
          {
            membership_plan_id: membershipPlanId,
            voucher_id: voucherId,
            quantity: 1,
            is_active: true,
          },
          causer,
        ),
      ),
    );
  }

  /**
   * Sync billing period pricing entries for a membership plan.
   * Upserts rows present in the input and soft-deletes rows no longer included.
   */
  private async syncBillingPeriods(
    membershipPlanId: number,
    billingPeriods: BillingPeriodPlanItemDto[],
    causer: User,
  ): Promise<void> {
    const existingRows = await this.membershipPlanBillingPeriodRepository.find({
      where: {
        membership_plan_id: membershipPlanId,
        deleted_at: IsNull(),
      },
    });

    const existingMap = new Map<number, MembershipPlanBillingPeriodEntity>(
      existingRows.map((row) => [row.billing_period_id, row]),
    );

    const inputBillingPeriodIds = new Set(
      billingPeriods.map((bp) => bp.billing_period_id),
    );

    // Upsert rows present in the input
    const upsertPromises = billingPeriods.map((bp) => {
      const existing = existingMap.get(bp.billing_period_id);
      if (existing) {
        return this.membershipPlanBillingPeriodRepository.save({
          ...existing,
          total_price: bp.total_price,
          discount_percentage: bp.discount_percentage ?? 0,
          is_active: true,
          updated_by: { id: causer.id } as any,
        });
      }

      return this.membershipPlanBillingPeriodRepository.save(
        this.membershipPlanBillingPeriodRepository.create({
          membership_plan_id: membershipPlanId,
          billing_period_id: bp.billing_period_id,
          total_price: bp.total_price,
          discount_percentage: bp.discount_percentage ?? 0,
          is_active: true,
          created_by: { id: causer.id } as any,
          updated_by: { id: causer.id } as any,
        }),
      );
    });

    await Promise.all(upsertPromises);

    // Recalculate discount percentages based on the monthly billing period price
    const savedRows = await this.membershipPlanBillingPeriodRepository.find({
      where: { membership_plan_id: membershipPlanId, deleted_at: IsNull() },
      relations: ['billing_period'],
    });

    const monthlyRow = savedRows.find(
      (row) => row.billing_period?.duration_in_months === 1,
    );

    if (monthlyRow) {
      const monthlyPrice = Number(monthlyRow.total_price);
      if (monthlyPrice > 0) {
        const discountUpdates = savedRows
          .filter(
            (row) =>
              row.billing_period &&
              row.billing_period.duration_in_months > 1 &&
              billingPeriods.some(
                (bp) => bp.billing_period_id === row.billing_period_id,
              ),
          )
          .map((row) => {
            const months = row.billing_period!.duration_in_months;
            const expectedFull = monthlyPrice * months;
            const discount =
              ((expectedFull - Number(row.total_price)) / expectedFull) * 100;
            const clampedDiscount =
              Math.round(Math.max(0, Math.min(100, discount)) * 100) / 100;
            return this.membershipPlanBillingPeriodRepository.update(row.id, {
              discount_percentage: clampedDiscount,
            });
          });
        await Promise.all(discountUpdates);
      }
    }

    // Soft-delete rows not present in the input
    const rowsToRemove = existingRows.filter(
      (row) => !inputBillingPeriodIds.has(row.billing_period_id),
    );

    if (rowsToRemove.length > 0) {
      const removeIds = rowsToRemove.map((row) => row.id);
      await this.membershipPlanBillingPeriodRepository.update(removeIds, {
        deleted_by: { id: causer.id } as any,
      });
      await this.membershipPlanBillingPeriodRepository.softRemove(rowsToRemove);
    }
  }

  /**
   * Soft delete membership plan and cascade soft-delete linked billing periods.
   */
  async delete(id: number, causer: User): Promise<void> {
    // Verify membership plan exists
    await this.findById(id);

    // Cascade soft-delete all linked billing period rows
    const billingPeriodRows =
      await this.membershipPlanBillingPeriodRepository.find({
        where: { membership_plan_id: id, deleted_at: IsNull() },
      });

    if (billingPeriodRows.length > 0) {
      const removeIds = billingPeriodRows.map((row) => row.id);
      await this.membershipPlanBillingPeriodRepository.update(removeIds, {
        deleted_by: { id: causer.id } as any,
      });
      await this.membershipPlanBillingPeriodRepository.softRemove(
        billingPeriodRows,
      );
    }

    return this.membershipPlanRepository.remove(id, causer);
  }
}
