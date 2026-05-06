import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

/**
 * DTO for upgrading a subscription plan.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpgradePlanDto {
  @ApiProperty({
    description: 'ID of the new plan to upgrade to',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  new_plan_id: number;

  @ApiPropertyOptional({
    description: 'Reason for the upgrade',
    example: 'Customer requested upgrade to higher tier',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Whether to prorate the billing (default: true)',
    example: true,
  })
  @IsOptional()
  prorate?: boolean;
}
