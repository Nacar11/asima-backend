import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

/**
 * Service for seeding subscription payments
 */
@Injectable()
export class SubscriptionPaymentsSeedService {
  constructor(
    @InjectRepository(SubscriptionPaymentEntity)
    private repository: Repository<SubscriptionPaymentEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const subscriptions = await this.subscriptionRepository.find({
        take: 10,
      });

      if (subscriptions.length === 0) {
        console.log(
          '⚠️  No subscriptions found. Skipping subscription payments seed.',
        );
        return;
      }

      const adminUser = await this.userRepository.findOne({
        where: {
          id: 1,
        },
      });

      if (!adminUser) {
        console.error(
          '❌ Admin user not found. Cannot proceed to seed subscription payments.',
        );
        return;
      }

      const now = new Date();
      const payments: DeepPartial<SubscriptionPaymentEntity>[] = [];

      // Process each subscription and create payments
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i];
        const subscriptionNumber = subscription.subscription_number;
        const paymentNumber = subscriptionNumber.replace('SUB-', 'SUBPAY-');

        // Get plan details from subscription
        const plan = subscription.plan;
        const amount = plan?.price || 0;

        // Calculate billing cycle dates
        const startDate = new Date(subscription.start_date);
        const endDate = subscription.end_date
          ? new Date(subscription.end_date)
          : new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 7); // 7 days after start

        // Create payment based on subscription status
        let paymentStatus = SubscriptionPaymentStatusEnum.PENDING;
        let paidAt: Date | null = null;
        let transactionId: string | null = null;
        let paymentMethod: string | null = null;

        if (subscription.status === SubscriptionStatusEnum.ACTIVE) {
          // For active subscriptions, create paid payments
          paymentStatus = SubscriptionPaymentStatusEnum.PAID;
          paidAt = new Date(startDate);
          paidAt.setHours(paidAt.getHours() + 2); // Paid 2 hours after start
          transactionId = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
          paymentMethod = i % 2 === 0 ? 'gcash' : 'paymaya';
        } else if (
          subscription.status === SubscriptionStatusEnum.PENDING_PAYMENT
        ) {
          paymentStatus = SubscriptionPaymentStatusEnum.PENDING;
        } else if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
          // Some cancelled subscriptions might have refunded payments
          if (i % 3 === 0) {
            paymentStatus = SubscriptionPaymentStatusEnum.REFUNDED;
            paidAt = new Date(startDate);
            paidAt.setHours(paidAt.getHours() + 2);
            transactionId = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
            paymentMethod = 'gcash';
          } else {
            paymentStatus = SubscriptionPaymentStatusEnum.PENDING;
          }
        } else if (subscription.status === SubscriptionStatusEnum.EXPIRED) {
          // Expired subscriptions might have failed payments
          if (i % 2 === 0) {
            paymentStatus = SubscriptionPaymentStatusEnum.FAILED;
          } else {
            paymentStatus = SubscriptionPaymentStatusEnum.PAID;
            paidAt = new Date(startDate);
            paidAt.setHours(paidAt.getHours() + 2);
            transactionId = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
            paymentMethod = 'bank_transfer';
          }
        }

        payments.push({
          subscription_id: subscription.id,
          payment_number: `${paymentNumber}-${String(i + 1).padStart(3, '0')}`,
          amount: amount,
          payment_status: paymentStatus,
          transaction_id: transactionId,
          payment_method: paymentMethod,
          billing_cycle_start: startDate,
          billing_cycle_end: endDate,
          due_date: dueDate,
          paid_at: paidAt,
          created_by: adminUser,
          updated_by: adminUser,
        });

        // For active subscriptions, create additional historical payments
        if (subscription.status === SubscriptionStatusEnum.ACTIVE && i < 3) {
          const previousStart = new Date(startDate);
          previousStart.setMonth(previousStart.getMonth() - 1);
          const previousEnd = new Date(startDate);

          payments.push({
            subscription_id: subscription.id,
            payment_number: `${paymentNumber}-${String(i + 2).padStart(3, '0')}`,
            amount: amount,
            payment_status: SubscriptionPaymentStatusEnum.PAID,
            transaction_id: `TXN-${previousStart.getFullYear()}${String(previousStart.getMonth() + 1).padStart(2, '0')}${String(previousStart.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
            payment_method: i % 2 === 0 ? 'gcash' : 'paymaya',
            billing_cycle_start: previousStart,
            billing_cycle_end: previousEnd,
            due_date: new Date(
              previousStart.getTime() + 7 * 24 * 60 * 60 * 1000,
            ),
            paid_at: new Date(previousStart.getTime() + 2 * 60 * 60 * 1000),
            created_by: adminUser,
            updated_by: adminUser,
          });
        }
      }

      if (payments.length > 0) {
        await this.repository.save(
          payments.map((payment) => this.repository.create(payment)),
        );

        console.log(
          `✅ ${payments.length} subscription payments seeded successfully`,
        );
      } else {
        console.log('⚠️  No subscription payments created.');
      }
    }
  }
}
