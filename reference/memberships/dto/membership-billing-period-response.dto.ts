import { ApiProperty } from '@nestjs/swagger';

export class BillingPeriodDetailDto {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'monthly' })
  period_code: string;

  @ApiProperty({ type: String, example: '1 Month' })
  period_name: string;

  @ApiProperty({ type: Number, example: 1 })
  duration_in_months: number;

  @ApiProperty({ type: Number, example: 30 })
  duration_in_days: number;

  @ApiProperty({ type: Number, example: 0 })
  sort_order: number;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;
}

export class MembershipBillingPeriodResponseDto {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  membership_plan_id: number;

  @ApiProperty({ type: Number, example: 1 })
  billing_period_id: number;

  @ApiProperty({ type: Number, example: 1499.0 })
  total_price: number;

  @ApiProperty({ type: Number, example: 0 })
  discount_percentage: number;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;

  @ApiProperty({ type: () => BillingPeriodDetailDto })
  billing_period: BillingPeriodDetailDto;
}
