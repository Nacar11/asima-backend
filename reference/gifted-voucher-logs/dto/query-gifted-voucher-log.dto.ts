import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryGiftedVoucherLogDto {
  @ApiPropertyOptional({
    description:
      'Filter by source: "admin" for admin-created vouchers (seller_id IS NULL), or a numeric seller ID',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description:
      'Filter by eligible seller: show gift logs whose voucher has eligible items (services/products/categories/service-categories) owned by this seller',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eligible_seller_id?: number;

  @ApiPropertyOptional({ description: 'Filter by voucher ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  voucher_id?: number;

  @ApiPropertyOptional({ description: 'Filter by the user who gifted' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gifted_by_user_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by the user who received the gift',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gifted_to_user_id?: number;

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
    enum: ['gifted_at', 'quantity'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['gifted_at', 'quantity'])
  sortField?: 'gifted_at' | 'quantity';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';
}
