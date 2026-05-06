import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding subscription plans
 */
@Injectable()
export class SubscriptionPlansSeedService implements ISeedService {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private repository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (count > 0) {
      console.log('⚠️  Subscription plans already exist, skipping seed');
      return;
    }

    const user = await this.userRepository.findOne({
      where: {
        id: 1,
      },
    });

    if (!user) {
      console.error(
        '❌ No user found. Cannot proceed to seed subscription plans.',
      );
      return;
    }

    const phpCurrency = await this.currencyRepository.findOne({
      where: {
        code: 'PHP',
      },
    });

    if (!phpCurrency) {
      console.error(
        '❌ PHP currency not found. Cannot proceed to seed subscription plans.',
      );
      return;
    }

    const plans = [
      {
        plan_name: 'Basic',
        plan_code: 'BASIC',
        description: 'Basic plan with essential features',
        plan_type: PlanTypeEnum.UNIFIED,
        price: 0,
        currency_id: phpCurrency.id,
        billing_cycle: BillingCycleEnum.MONTHLY,
        features: [
          'Basic marketplace access',
          'Up to 10 products',
          'Up to 5 services',
          '1 seller account',
          'Basic analytics',
        ],
        max_sellers: 1,
        max_products: 10,
        max_services: 5,
        max_members: 2,
        commission_percent: 10.0,
        display_order: 1,
        status: PlanStatusEnum.ACTIVE,
        created_by: user,
        updated_by: user,
      },
    ];

    await this.repository.save(
      plans.map((plan) => this.repository.create(plan)),
    );

    console.log(`✅ ${plans.length} subscription plans seeded successfully`);
  }
}
