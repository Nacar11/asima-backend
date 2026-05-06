import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  IsPositive,
  IsEnum,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CheckoutPaymentStatusEnum } from '../enums/checkout-payment-status.enum';

/**
 * DTO for querying checkout payments.
 *
 * Used for filtering and paginating checkout payments.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryCheckoutPaymentDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by checkout order ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  checkout_order_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: CheckoutPaymentStatusEnum,
    example: CheckoutPaymentStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(CheckoutPaymentStatusEnum)
  status?: CheckoutPaymentStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by payment method code',
    example: 'gcash',
  })
  @IsOptional()
  @IsString()
  payment_method_code?: string;
}
