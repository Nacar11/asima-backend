import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single billing-period entry when creating or updating a membership plan.
 */
export class BillingPeriodPlanItemDto {
  @ApiProperty({
    description: 'Billing period ID to associate with this plan',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  billing_period_id: number;

  @ApiProperty({
    description: 'Total price for this plan + billing period combination',
    example: 99.99,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_price: number;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount_percentage?: number;
}
