import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SubscriptionOperationEntity } from '@/admin-subscriptions/persistence/entities/subscription-operation.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

/**
 * Service for seeding subscription operations
 */
@Injectable()
export class SubscriptionOperationsSeedService {
  constructor(
    @InjectRepository(SubscriptionOperationEntity)
    private repository: Repository<SubscriptionOperationEntity>,
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
          '⚠️  No subscriptions found. Skipping subscription operations seed.',
        );
        return;
      }

      const adminUsers = await this.userRepository.find({
        where: {
          system_admin: true,
        },
        take: 2,
      });

      if (adminUsers.length === 0) {
        // Fallback to user with id 1
        const fallbackUser = await this.userRepository.findOne({
          where: {
            id: 1,
          },
        });

        if (!fallbackUser) {
          console.error(
            '❌ No admin users found. Cannot proceed to seed subscription operations.',
          );
          return;
        }

        adminUsers.push(fallbackUser);
      }

      const now = new Date();
      const operations: DeepPartial<SubscriptionOperationEntity>[] = [];

      // Create operations for different subscription types
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i];
        const adminUser = adminUsers[i % adminUsers.length];

        // Create operations based on subscription status
        if (subscription.status === SubscriptionStatusEnum.ACTIVE) {
          // Renew operation
          operations.push({
            subscription_id: subscription.id,
            operation_type: SubscriptionOperationTypeEnum.RENEW,
            performed_by: adminUser.id,
            reason: 'Manual renewal for testing purposes',
            metadata: {
              previous_end_date: subscription.end_date,
              new_end_date: subscription.next_billing_date,
            },
            performed_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          });

          // Extend operation
          if (i % 2 === 0) {
            operations.push({
              subscription_id: subscription.id,
              operation_type: SubscriptionOperationTypeEnum.EXTEND,
              performed_by: adminUser.id,
              reason: 'Extended subscription by 7 days due to customer request',
              metadata: {
                extended_days: 7,
                previous_end_date: subscription.end_date,
              },
              performed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            });
          }
        } else if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
          // Cancel operation
          operations.push({
            subscription_id: subscription.id,
            operation_type: SubscriptionOperationTypeEnum.CANCEL,
            performed_by: adminUser.id,
            reason:
              subscription.cancellation_reason || 'User requested cancellation',
            metadata: {
              cancelled_at: subscription.cancelled_at,
              cancellation_reason: subscription.cancellation_reason,
            },
            performed_at:
              subscription.cancelled_at ||
              new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          });

          // Refund operation (if applicable)
          if (i % 3 === 0) {
            operations.push({
              subscription_id: subscription.id,
              operation_type: SubscriptionOperationTypeEnum.REFUND,
              performed_by: adminUser.id,
              reason: 'Refund processed for cancelled subscription',
              metadata: {
                refund_amount: subscription.plan?.price || 0,
                refund_method: 'original_payment_method',
              },
              performed_at: new Date(
                (subscription.cancelled_at?.getTime() || now.getTime()) +
                  24 * 60 * 60 * 1000,
              ), // 1 day after cancellation
            });
          }
        } else if (
          subscription.status === SubscriptionStatusEnum.PENDING_PAYMENT
        ) {
          // Retry payment operation
          operations.push({
            subscription_id: subscription.id,
            operation_type: SubscriptionOperationTypeEnum.RETRY_PAYMENT,
            performed_by: adminUser.id,
            reason: 'Retrying failed payment',
            metadata: {
              retry_count: 1,
              payment_method: 'gcash',
            },
            performed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          });
        } else if (subscription.status === SubscriptionStatusEnum.SUSPENDED) {
          // Suspend operation
          operations.push({
            subscription_id: subscription.id,
            operation_type: SubscriptionOperationTypeEnum.SUSPEND,
            performed_by: adminUser.id,
            reason: 'Subscription suspended due to payment issues',
            metadata: {
              suspension_reason: 'payment_failure',
            },
            performed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          });
        } else if (subscription.status === SubscriptionStatusEnum.EXPIRED) {
          // Activate operation (reactivation)
          if (i % 2 === 0) {
            operations.push({
              subscription_id: subscription.id,
              operation_type: SubscriptionOperationTypeEnum.ACTIVATE,
              performed_by: adminUser.id,
              reason: 'Reactivating expired subscription',
              metadata: {
                reactivation_date: new Date(
                  now.getTime() - 1 * 24 * 60 * 60 * 1000,
                ),
              },
              performed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            });
          }
        }

        // Add some historical operations for active subscriptions
        if (subscription.status === SubscriptionStatusEnum.ACTIVE && i < 3) {
          // Historical renew operation
          operations.push({
            subscription_id: subscription.id,
            operation_type: SubscriptionOperationTypeEnum.RENEW,
            performed_by: adminUser.id,
            reason: 'Previous renewal',
            metadata: {
              renewal_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
            performed_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          });
        }
      }

      if (operations.length > 0) {
        await this.repository.save(
          operations.map((op) => this.repository.create(op)),
        );

        console.log(
          `✅ ${operations.length} subscription operations seeded successfully`,
        );
      } else {
        console.log('⚠️  No subscription operations created.');
      }
    }
  }
}
