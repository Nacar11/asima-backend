import { ApiProperty } from '@nestjs/swagger';

/**
 * SubscriptionOverview domain model.
 *
 * Represents subscription metrics and overview data for admin dashboard.
 *
 * @version 1
 * @since 1.0.0
 */
export class SubscriptionOverview {
  @ApiProperty({
    type: Number,
    example: 150,
    description: 'Total number of active subscriptions',
  })
  totalActive: number;

  @ApiProperty({
    type: Number,
    example: 25,
    description: 'Total number of cancelled subscriptions',
  })
  totalCancelled: number;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Total number of expired subscriptions',
  })
  totalExpired: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Total number of subscriptions with pending payment',
  })
  totalPendingPayment: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Total number of suspended subscriptions',
  })
  totalSuspended: number;

  @ApiProperty({
    type: Number,
    example: 45000.0,
    description: 'Monthly Recurring Revenue (MRR)',
  })
  monthlyRecurringRevenue: number;

  @ApiProperty({
    type: Number,
    example: 5.2,
    description: 'Churn rate percentage',
  })
  churnRate: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Number of upcoming renewals in next 30 days',
  })
  upcomingRenewals: number;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Number of failed payments requiring attention',
  })
  failedPayments: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of paid payments',
  })
  paidPayments: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of pending payments',
  })
  pendingPayments: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of refunded payments',
  })
  refundedPayments: number;
}
