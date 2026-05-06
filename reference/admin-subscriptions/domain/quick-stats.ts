import { ApiProperty } from '@nestjs/swagger';

/**
 * QuickStats domain model.
 *
 * Represents quick statistics for the admin subscription operations dashboard.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuickStats {
  @ApiProperty({
    type: Number,
    example: 47,
    description: 'Number of subscriptions pending renewal',
  })
  pendingRenewals: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Number of failed payments requiring attention',
  })
  failedPayments: number;

  @ApiProperty({
    type: Number,
    example: 23,
    description: 'Number of subscriptions currently in grace period',
  })
  gracePeriodActive: number;

  @ApiProperty({
    type: Number,
    example: 8,
    description: 'Number of subscription extensions processed today',
  })
  extensionsToday: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Number of subscriptions suspended today',
  })
  suspendedToday: number;

  @ApiProperty({
    type: Number,
    example: 15,
    description: 'Number of successful renewals today',
  })
  renewalsToday: number;
}
