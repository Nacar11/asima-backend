import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Membership billing period domain entity.
 */
export class MembershipBillingPeriod {
  @ApiProperty({
    description: 'Unique identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Period code identifier',
    example: 'monthly',
    maxLength: 50,
  })
  period_code: string;

  @ApiProperty({
    description: 'Period display name',
    example: 'Monthly',
    maxLength: 100,
  })
  period_name: string;

  @ApiProperty({
    description: 'Duration in months',
    example: 1,
  })
  duration_in_months: number;

  @ApiProperty({
    description: 'Duration in days',
    example: 30,
  })
  duration_in_days: number;

  @ApiProperty({
    description: 'Sort order for display',
    example: 0,
  })
  sort_order: number;

  @ApiProperty({
    description: 'Whether the billing period is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'User who created this billing period',
    example: 1,
    required: false,
    nullable: true,
  })
  created_by?: number | null;

  @ApiProperty({
    description: 'Creation timestamp',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @ApiProperty({
    description: 'User who last updated this billing period',
    example: 1,
    required: false,
    nullable: true,
  })
  updated_by?: number | null;

  @ApiProperty({
    description: 'Last update timestamp',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'User who deleted this billing period',
    example: 1,
    required: false,
    nullable: true,
  })
  deleted_by?: number | null;

  @ApiProperty({
    description: 'Soft delete timestamp',
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  deleted_at: Date | null;

  @Exclude()
  __entity?: string;
}
