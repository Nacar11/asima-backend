import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillingPeriodPlanItemDto } from './billing-period-plan-item.dto';

/**
 * Update membership plan DTO.
 */
export class UpdateMembershipPlanDto {
  @ApiProperty({
    description: 'Plan code identifier',
    example: 'starter',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  plan_code?: string;

  @ApiProperty({
    description: 'Plan display name',
    example: 'Starter Plan',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  plan_name?: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'A great plan for beginners',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({
    description: 'Voucher IDs to associate with this plan',
    type: () => [Number],
    required: false,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  voucher_ids?: number[];

  @ApiProperty({
    type: () => [BillingPeriodPlanItemDto],
    required: false,
    description: 'Billing period pricing entries for this plan',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillingPeriodPlanItemDto)
  billing_periods?: BillingPeriodPlanItemDto[];
}
