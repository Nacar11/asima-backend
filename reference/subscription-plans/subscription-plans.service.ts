import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';
import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';
import { CreateSubscriptionPlanDto } from '@/subscription-plans/dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '@/subscription-plans/dto/update-subscription-plan.dto';
import { QuerySubscriptionPlanDto } from '@/subscription-plans/dto/query-subscription-plan.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    private readonly subscriptionPlanRepository: BaseSubscriptionPlanRepository,
  ) {}

  async create(
    createDto: CreateSubscriptionPlanDto,
    causer: User,
  ): Promise<SubscriptionPlan> {
    // Check if plan code already exists
    const existingPlan = await this.subscriptionPlanRepository.findByCode(
      createDto.plan_code,
    );
    if (existingPlan) {
      throw new UnprocessableEntityException('Plan code already exists!');
    }

    return this.subscriptionPlanRepository.create({
      plan_name: createDto.plan_name,
      plan_code: createDto.plan_code,
      description: createDto.description,
      plan_type: createDto.plan_type ?? PlanTypeEnum.UNIFIED,
      price: createDto.price,
      currency_id: createDto.currency_id,
      billing_cycle: createDto.billing_cycle ?? BillingCycleEnum.MONTHLY,
      features: createDto.features ?? [],
      max_sellers: createDto.max_sellers ?? 1,
      max_products: createDto.max_products,
      max_services: createDto.max_services,
      max_members: createDto.max_members,
      commission_percent: createDto.commission_percent ?? 10.0,
      display_order: createDto.display_order ?? 0,
      status: createDto.status ?? PlanStatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  async findAllWithPagination(
    query: QuerySubscriptionPlanDto,
  ): Promise<IPaginatedResult<SubscriptionPlan>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);

    return this.subscriptionPlanRepository.findAllWithPagination({
      filterQuery: query,
      paginationOptions: { page, limit },
    });
  }

  async findById(id: number): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findById(id);

    if (!plan) {
      throw new NotFoundException('Subscription plan not found!');
    }

    return plan;
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.findActive();
  }

  async update(
    id: number,
    updateDto: UpdateSubscriptionPlanDto,
    causer: User,
  ): Promise<SubscriptionPlan> {
    const plan = await this.findById(id);

    // Check if plan code is being changed and if new code already exists
    if (updateDto.plan_code && updateDto.plan_code !== plan.plan_code) {
      const existingPlan = await this.subscriptionPlanRepository.findByCode(
        updateDto.plan_code,
      );
      if (existingPlan) {
        throw new UnprocessableEntityException('Plan code already exists!');
      }
    }

    return this.subscriptionPlanRepository.update(id, {
      ...updateDto,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.subscriptionPlanRepository.remove(id, causer);
  }

  async bulkDelete(ids: number[], causer: User): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    for (const id of ids) {
      await this.findById(id);
    }
    for (const id of ids) {
      await this.remove(id, causer);
    }
  }

  async lookup(query: LookUpDto): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    return this.subscriptionPlanRepository.lookup(query);
  }
}
