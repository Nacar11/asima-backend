import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

export class QuerySubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatusEnum })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum)
  status?: SubscriptionStatusEnum;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  plan_id?: number;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'id',
    description: 'Field to sort by',
    enum: [
      'subscription_number',
      'status',
      'start_date',
      'end_date',
      'next_billing_date',
      'user_id',
      'plan_id',
      'created_at',
      'updated_at',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'subscription_number',
    'status',
    'start_date',
    'end_date',
    'next_billing_date',
    'user_id',
    'plan_id',
    'created_at',
    'updated_at',
  ])
  sortField?:
    | 'subscription_number'
    | 'status'
    | 'start_date'
    | 'end_date'
    | 'next_billing_date'
    | 'user_id'
    | 'plan_id'
    | 'created_at'
    | 'updated_at';

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
}
