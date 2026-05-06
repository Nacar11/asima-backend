import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';

/**
 * DTO for creating a seller earning record.
 *
 * Used when recording earnings from bookings or sales orders.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSellerEarningDto {
  @ApiProperty({
    description: 'Seller ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  seller_id: number;

  @ApiProperty({
    description: 'Source type (booking or sales_order)',
    example: 'booking',
    enum: ['booking', 'sales_order'],
  })
  @IsString()
  @IsIn(['booking', 'sales_order'])
  source_type: string;

  @ApiProperty({
    description: 'Source ID (booking_id or sales_order_id)',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  source_id: number;

  @ApiPropertyOptional({
    description: 'Milestone ID (if earning is for a specific milestone)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  milestone_id?: number;

  @ApiProperty({
    description: 'Gross amount before platform fee',
    example: 10000.0,
  })
  @IsNumber()
  @Min(0.01)
  gross_amount: number;

  @ApiPropertyOptional({
    description: 'Platform fee amount',
    example: 1000.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platform_fee?: number;

  @ApiProperty({
    description: 'Net amount after platform fee',
    example: 9000.0,
  })
  @IsNumber()
  @Min(0.01)
  net_amount: number;

  @ApiPropertyOptional({
    description: 'Currency ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  currency_id?: number;

  @ApiPropertyOptional({
    description: 'Earnings status',
    example: 'pending',
    enum: ['pending', 'available', 'processing', 'paid', 'held'],
    default: 'pending',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'available', 'processing', 'paid', 'held'])
  status?: string;

  @ApiPropertyOptional({
    description: 'When funds become available for withdrawal',
    example: '2024-12-11T09:00:00Z',
  })
  @IsOptional()
  available_at?: Date;
}
