import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { EarningsStatusEnum } from '../enums/earnings-status.enum';

/**
 * Seller Earning domain model.
 *
 * Represents earnings from bookings and sales orders, including
 * platform fees and net amounts.
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerEarning {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller earning ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Seller details',
  })
  seller?: any;

  @ApiProperty({
    type: String,
    example: 'booking',
    description: 'Source type (booking or sales_order)',
    enum: ['booking', 'sales_order'],
  })
  source_type: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Source ID (booking_id or sales_order_id)',
  })
  source_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Milestone ID (if earning is for a specific milestone)',
    nullable: true,
  })
  milestone_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Milestone details',
    nullable: true,
  })
  milestone?: any;

  @ApiProperty({
    type: Number,
    example: 10000.0,
    description: 'Gross amount before platform fee',
  })
  gross_amount: number;

  @ApiProperty({
    type: Number,
    example: 1000.0,
    description: 'Platform fee amount',
  })
  platform_fee: number;

  @ApiProperty({
    type: Number,
    example: 9000.0,
    description: 'Net amount after platform fee',
  })
  net_amount: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Currency ID',
    nullable: true,
  })
  currency_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Currency details',
    nullable: true,
  })
  currency?: any | null;

  @ApiProperty({
    enum: EarningsStatusEnum,
    example: EarningsStatusEnum.PENDING,
    description: 'Earnings status',
    default: EarningsStatusEnum.PENDING,
  })
  status: EarningsStatusEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When funds become available for withdrawal',
    nullable: true,
  })
  available_at?: Date | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this earning record',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this earning record',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
