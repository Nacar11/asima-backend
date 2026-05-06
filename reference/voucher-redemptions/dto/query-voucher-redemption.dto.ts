import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryVoucherRedemptionDto {
  @ApiPropertyOptional({ description: 'Filter by user voucher ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_voucher_id?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ description: 'Filter by sales order ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sales_order_id?: number;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  booking_id?: number;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    description:
      'Search by customer name, voucher code, or merchant store name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by channel',
    enum: ['Online', 'Onsite'],
  })
  @IsOptional()
  @IsIn(['Online', 'Onsite'])
  channel?: 'Online' | 'Onsite';

  @ApiPropertyOptional({ description: 'Filter by date range start (ISO date)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter by date range end (ISO date)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['redeemed_at', 'discount_amount', 'order_subtotal', 'created_at'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['redeemed_at', 'discount_amount', 'order_subtotal', 'created_at'])
  sortField?:
    | 'redeemed_at'
    | 'discount_amount'
    | 'order_subtotal'
    | 'created_at';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
