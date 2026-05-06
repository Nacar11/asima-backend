import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';

export class QuerySubscriptionPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PlanStatusEnum })
  @IsOptional()
  @IsEnum(PlanStatusEnum)
  status?: PlanStatusEnum;

  @ApiPropertyOptional({ enum: PlanTypeEnum })
  @IsOptional()
  @IsEnum(PlanTypeEnum)
  plan_type?: PlanTypeEnum;

  @ApiPropertyOptional({ enum: BillingCycleEnum })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  billing_cycle?: BillingCycleEnum;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'display_order',
    description: 'Field to sort by',
    enum: [
      'plan_name',
      'plan_code',
      'plan_type',
      'price',
      'billing_cycle',
      'display_order',
      'status',
      'created_at',
      'updated_at',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'plan_name',
    'plan_code',
    'plan_type',
    'price',
    'billing_cycle',
    'display_order',
    'status',
    'created_at',
    'updated_at',
  ])
  sortField?:
    | 'plan_name'
    | 'plan_code'
    | 'plan_type'
    | 'price'
    | 'billing_cycle'
    | 'display_order'
    | 'status'
    | 'created_at'
    | 'updated_at';

  @ApiPropertyOptional({
    type: String,
    example: 'ASC',
    description: 'Sort direction (ASC or DESC, default: ASC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
