import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

/**
 * Subscription details included in operation response.
 */
export class SubscriptionOperationSubscription {
  @ApiProperty({
    type: String,
    example: 'SUB-20251212-1234',
    description: 'Subscription number',
  })
  subscription_number: string;

  @ApiProperty({
    enum: SubscriptionStatusEnum,
    example: SubscriptionStatusEnum.ACTIVE,
    description: 'Subscription status',
  })
  status: SubscriptionStatusEnum;

  @ApiProperty({
    type: Date,
    example: '2025-12-12',
    description: 'Subscription start date',
  })
  start_date: Date;

  @ApiProperty({
    type: Date,
    example: '2026-01-12',
    description: 'Subscription end date',
    nullable: true,
  })
  end_date: Date | null;
}

/**
 * SubscriptionOperation domain model.
 *
 * Represents an admin operation performed on a subscription.
 *
 * @version 1
 * @since 1.0.0
 */
export class SubscriptionOperation {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Operation ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 123,
    description: 'Subscription ID',
  })
  subscription_id: number;

  @ApiPropertyOptional({
    type: () => SubscriptionOperationSubscription,
    description: 'Subscription details',
  })
  subscription?: SubscriptionOperationSubscription;

  @ApiProperty({
    enum: SubscriptionOperationTypeEnum,
    example: SubscriptionOperationTypeEnum.RENEW,
    description: 'Type of operation performed',
  })
  operation_type: SubscriptionOperationTypeEnum;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Admin user ID who performed the operation',
  })
  performed_by: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Admin who performed the operation',
  })
  performer?: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiPropertyOptional({
    type: String,
    example: 'Manual renewal due to payment issue',
    description: 'Reason for the operation',
    nullable: true,
  })
  reason?: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: { extended_days: 30, previous_end_date: '2025-12-31' },
    description: 'Additional metadata about the operation',
    nullable: true,
  })
  metadata?: any | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T10:30:00Z',
    description: 'When the operation was performed',
  })
  performed_at: Date;

  @Exclude()
  __entity?: string;
}
