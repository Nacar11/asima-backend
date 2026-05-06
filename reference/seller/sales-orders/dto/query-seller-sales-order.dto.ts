import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

export class QuerySellerSalesOrderDto {
  @ApiPropertyOptional({
    type: String,
    example: 'created_at',
    description: 'Field to sort by. Defaults to created_at if not specified.',
    enum: [
      'created_at',
      'updated_at',
      'total_amount',
      'subtotal',
      'tax_amount',
      'shipping_amount',
      'order_number',
      'status',
      'user_name',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'created_at',
    'updated_at',
    'total_amount',
    'subtotal',
    'tax_amount',
    'shipping_amount',
    'order_number',
    'status',
    'user_name',
  ])
  sortField?:
    | 'created_at'
    | 'updated_at'
    | 'total_amount'
    | 'subtotal'
    | 'tax_amount'
    | 'shipping_amount'
    | 'order_number'
    | 'status'
    | 'user_name';

  @ApiPropertyOptional({
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort direction (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: 'pending',
    description: 'Filter by order status',
    enum: OrderStatusEnum,
  })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Filter orders from this date (inclusive)',
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Filter orders up to this date (inclusive)',
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional({
    example: 'ORD-123 or John',
    description:
      'Search across order number and customer name (partial match, OR logic)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'ORD-123',
    description: 'Filter by order number (partial match)',
  })
  @IsOptional()
  @IsString()
  order_number?: string;

  @ApiPropertyOptional({
    example: 'John',
    description:
      'Filter by customer name (partial match on first or last name)',
  })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Filter by minimum subtotal amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  subtotal_min?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Filter by maximum subtotal amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  subtotal_max?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Filter by minimum total amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  total_min?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Filter by maximum total amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  total_max?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Filter by minimum tax amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  tax_min?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Filter by maximum tax amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  tax_max?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Filter by minimum shipping amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  shipping_min?: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Filter by maximum shipping amount',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseFloat(value);
  })
  shipping_max?: number;
}
