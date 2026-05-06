import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';

export class SubscriptionPlan {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'Basic Plan' })
  plan_name: string;

  @ApiProperty({ type: String, example: 'BASIC' })
  plan_code: string;

  @ApiPropertyOptional({ type: String, example: 'Basic subscription plan' })
  description?: string | null;

  @ApiProperty({ enum: PlanTypeEnum, example: PlanTypeEnum.UNIFIED })
  plan_type: PlanTypeEnum;

  @ApiProperty({ type: Number, example: 499.0 })
  price: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  currency_id?: number | null;

  @ApiProperty({ enum: BillingCycleEnum, example: BillingCycleEnum.MONTHLY })
  billing_cycle: BillingCycleEnum;

  @ApiProperty({
    type: [String],
    example: ['Feature 1', 'Feature 2', 'Feature 3'],
  })
  features: string[];

  @ApiProperty({ type: Number, example: 1 })
  max_sellers: number;

  @ApiPropertyOptional({ type: Number, example: 100, nullable: true })
  max_products?: number | null;

  @ApiPropertyOptional({ type: Number, example: 50, nullable: true })
  max_services?: number | null;

  @ApiPropertyOptional({ type: Number, example: 5, nullable: true })
  max_members?: number | null;

  @ApiProperty({ type: Number, example: 10.0 })
  commission_percent: number;

  @ApiProperty({ type: Number, example: 0 })
  display_order: number;

  @ApiProperty({ enum: PlanStatusEnum, example: PlanStatusEnum.ACTIVE })
  status: PlanStatusEnum;

  @ApiPropertyOptional({ type: () => Object })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => Object })
  updated_by?: Causer | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;

  @ApiPropertyOptional({ nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
