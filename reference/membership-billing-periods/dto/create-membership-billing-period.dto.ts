import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';

/**
 * Create membership billing period DTO.
 */
export class CreateMembershipBillingPeriodDto {
  @ApiProperty({
    description: 'Period code identifier',
    example: 'monthly',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  period_code: string;

  @ApiProperty({
    description: 'Period display name',
    example: 'Monthly',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  period_name: string;

  @ApiProperty({
    description: 'Duration in months',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  duration_in_months: number;

  @ApiProperty({
    description: 'Duration in days',
    example: 30,
  })
  @IsInt()
  @IsPositive()
  duration_in_days: number;

  @ApiProperty({
    description: 'Sort order for display',
    example: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({
    description: 'Whether the billing period is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
