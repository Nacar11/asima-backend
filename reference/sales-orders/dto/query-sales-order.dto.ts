import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatusEnum } from '../domain/order-status.enum';
import { PaymentStatusEnum } from '../domain/payment-status.enum';

/**
 * Allowed fields for sorting orders
 */
export const ORDER_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'total_amount',
  'order_number',
] as const;

export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

/**
 * DTO for querying sales orders
 */
export class QuerySalesOrderDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Filter by order status(es). Supports comma-separated values for multiple statuses.',
    example: 'confirmed,shipped,delivered',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsEnum(OrderStatusEnum, { each: true })
  status?: OrderStatusEnum[];

  @ApiPropertyOptional({
    description:
      'Filter by payment status(es). Supports comma-separated values for multiple statuses.',
    example: 'awaiting_payment,failed',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsEnum(PaymentStatusEnum, { each: true })
  payment_status?: PaymentStatusEnum[];

  @ApiPropertyOptional({
    description: 'Field to sort by. Defaults to created_at if not specified.',
    enum: ORDER_SORT_FIELDS,
    example: 'created_at',
  })
  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sort_by?: OrderSortField;

  @ApiPropertyOptional({
    description: 'Sort order. Defaults to DESC if not specified.',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description:
      'Search across Product Name, Seller/Store Name, or Order ID (case-insensitive partial match)',
    example: 'laptop',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by fulfillment type.',
    enum: ['delivery', 'pickup'],
    example: 'pickup',
  })
  @IsOptional()
  @IsIn(['delivery', 'pickup'])
  fulfillment_type?: 'delivery' | 'pickup';
}
