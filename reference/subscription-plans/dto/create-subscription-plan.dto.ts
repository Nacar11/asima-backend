import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ type: String, example: 'Basic Plan' })
  @IsString()
  @MaxLength(100)
  plan_name: string;

  @ApiProperty({ type: String, example: 'BASIC' })
  @IsString()
  @MaxLength(50)
  plan_code: string;

  @ApiPropertyOptional({ type: String, example: 'Basic subscription plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PlanTypeEnum,
    example: PlanTypeEnum.UNIFIED,
    default: PlanTypeEnum.UNIFIED,
  })
  @IsOptional()
  @IsEnum(PlanTypeEnum)
  plan_type?: PlanTypeEnum;

  @ApiProperty({ type: Number, example: 499.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsInt()
  currency_id?: number;

  @ApiPropertyOptional({
    enum: BillingCycleEnum,
    example: BillingCycleEnum.MONTHLY,
    default: BillingCycleEnum.MONTHLY,
  })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  billing_cycle?: BillingCycleEnum;

  @ApiPropertyOptional({
    type: [String],
    example: ['Feature 1', 'Feature 2', 'Feature 3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_sellers?: number;

  @ApiPropertyOptional({ type: Number, example: 100, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_products?: number;

  @ApiPropertyOptional({ type: Number, example: 50, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_services?: number;

  @ApiPropertyOptional({ type: Number, example: 5, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_members?: number;

  @ApiPropertyOptional({ type: Number, example: 10.0, default: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission_percent?: number;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional({
    enum: PlanStatusEnum,
    example: PlanStatusEnum.ACTIVE,
    default: PlanStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PlanStatusEnum)
  status?: PlanStatusEnum;
}
