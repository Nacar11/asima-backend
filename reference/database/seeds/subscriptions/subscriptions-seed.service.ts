import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

/**
 * Service for seeding subscriptions
 */
@Injectable()
export class SubscriptionsSeedService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private repository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private planRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (count > 0) {
      console.log('⚠️  Subscriptions already exist, skipping seed');
      return;
    }

    const users = await this.userRepository.find({
      take: 5,
    });

    if (users.length === 0) {
      console.error('❌ No users found. Cannot proceed to seed subscriptions.');
      return;
    }

    const plans = await this.planRepository.find({
      take: 10,
    });

    if (plans.length === 0) {
      console.error(
        '❌ No subscription plans found. Cannot proceed to seed subscriptions.',
      );
      return;
    }

    const adminUser = users[0];
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const subscriptions: DeepPartial<SubscriptionEntity>[] = [];

    // Active subscription with auto-renew
    if (users[1] && plans[0]) {
      subscriptions.push({
        user_id: users[1].id,
        plan_id: plans[0].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0001`,
        status: SubscriptionStatusEnum.ACTIVE,
        start_date: now,
        end_date: oneMonthLater,
        next_billing_date: oneMonthLater,
        auto_renew: true,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Active subscription without auto-renew
    if (users[2] && plans[1]) {
      subscriptions.push({
        user_id: users[2].id,
        plan_id: plans[1].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0002`,
        status: SubscriptionStatusEnum.ACTIVE,
        start_date: now,
        end_date: oneMonthLater,
        next_billing_date: oneMonthLater,
        auto_renew: false,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Pending payment subscription
    if (users[3] && plans[0]) {
      subscriptions.push({
        user_id: users[3].id,
        plan_id: plans[0].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0003`,
        status: SubscriptionStatusEnum.PENDING_PAYMENT,
        start_date: now,
        end_date: null,
        next_billing_date: null,
        auto_renew: true,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Cancelled subscription
    if (users[4] && plans[1]) {
      const cancelledDate = new Date(now);
      cancelledDate.setDate(cancelledDate.getDate() - 5);

      subscriptions.push({
        user_id: users[4].id,
        plan_id: plans[1].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0004`,
        status: SubscriptionStatusEnum.CANCELLED,
        start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end_date: cancelledDate,
        next_billing_date: null,
        auto_renew: false,
        cancelled_at: cancelledDate,
        cancelled_by: adminUser,
        cancellation_reason: 'User requested cancellation',
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Expired subscription
    if (users[1] && plans[2]) {
      const expiredDate = new Date(now);
      expiredDate.setDate(expiredDate.getDate() - 10);

      subscriptions.push({
        user_id: users[1].id,
        plan_id: plans[2].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0005`,
        status: SubscriptionStatusEnum.EXPIRED,
        start_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        end_date: expiredDate,
        next_billing_date: null,
        auto_renew: false,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Suspended subscription
    if (users[2] && plans[0]) {
      subscriptions.push({
        user_id: users[2].id,
        plan_id: plans[0].id,
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0006`,
        status: SubscriptionStatusEnum.SUSPENDED,
        start_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        end_date: oneMonthLater,
        next_billing_date: oneMonthLater,
        auto_renew: true,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Quarterly subscription
    if (users[3] && plans.length > 7) {
      subscriptions.push({
        user_id: users[3].id,
        plan_id: plans[7].id, // Quarterly plan
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0007`,
        status: SubscriptionStatusEnum.ACTIVE,
        start_date: now,
        end_date: threeMonthsLater,
        next_billing_date: threeMonthsLater,
        auto_renew: true,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    // Yearly subscription
    if (users[4] && plans.length > 8) {
      subscriptions.push({
        user_id: users[4].id,
        plan_id: plans[8].id, // Yearly plan
        subscription_number: `SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-0008`,
        status: SubscriptionStatusEnum.ACTIVE,
        start_date: now,
        end_date: oneYearLater,
        next_billing_date: oneYearLater,
        auto_renew: true,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_by: adminUser,
        updated_by: adminUser,
      });
    }

    if (subscriptions.length > 0) {
      await this.repository.save(
        subscriptions.map((sub) => this.repository.create(sub)),
      );

      console.log(
        `✅ ${subscriptions.length} subscriptions seeded successfully`,
      );
    } else {
      console.log('⚠️  No subscriptions created. Check user and plan data.');
    }
  }
}
