import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';

export class PlanBillingPeriod {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2 })
  billing_period_id: number;

  @ApiProperty({ example: 1499.0 })
  total_price: number;

  @ApiProperty({ example: 0 })
  discount_percentage: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ required: false })
  billing_period?: {
    id: number;
    period_code: string;
    period_name: string;
    duration_in_months: number;
    duration_in_days: number;
    sort_order: number;
    is_active: boolean;
  };
}

/**
 * Membership plan domain entity.
 */
export class MembershipPlan {
  @ApiProperty({
    description: 'Unique identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Plan code identifier',
    example: 'starter',
    maxLength: 100,
  })
  plan_code: string;

  @ApiProperty({
    description: 'Plan display name',
    example: 'Starter Plan',
    maxLength: 255,
  })
  plan_name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Access to all basic features with monthly billing.',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description:
      'Monthly price from the billing period with duration_in_months = 1',
    example: 1499.0,
    required: false,
    nullable: true,
  })
  monthly_price?: number | null;

  @ApiProperty({
    description: 'User who created this plan',
    example: 1,
    required: false,
    nullable: true,
  })
  created_by?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @ApiProperty({
    description: 'User who last updated this plan',
    example: 1,
    required: false,
    nullable: true,
  })
  updated_by?: number;

  @ApiProperty({
    description: 'Last update timestamp',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'User who deleted this plan',
    example: 1,
    required: false,
    nullable: true,
  })
  deleted_by?: number;

  @ApiProperty({
    description: 'Soft delete timestamp',
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  deleted_at: Date | null;

  @ApiProperty({
    description: 'Voucher IDs included with this membership plan',
    required: false,
    type: () => [Number],
    example: [1, 2, 3],
  })
  voucher_ids?: number[];

  @ApiProperty({
    description: 'Voucher configurations linked to this membership plan',
    required: false,
    type: () => [MembershipVoucherConfiguration],
  })
  membership_voucher_configurations?: MembershipVoucherConfiguration[];

  @ApiProperty({
    description: 'Billing period pricing entries linked to this plan',
    required: false,
    type: () => [PlanBillingPeriod],
  })
  plan_billing_periods?: PlanBillingPeriod[];

  @Exclude()
  __entity?: string;
}
