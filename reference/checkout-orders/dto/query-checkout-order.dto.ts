import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CheckoutStatusEnum } from '@/checkout-orders/enums/checkout-status.enum';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';

/**
 * DTO for querying checkout orders.
 *
 * Used for filtering and paginating checkout orders.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryCheckoutOrderDto {
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
    description: 'Filter by checkout status',
    enum: CheckoutStatusEnum,
    example: CheckoutStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(CheckoutStatusEnum)
  status?: CheckoutStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatusEnum,
    example: PaymentStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  payment_status?: PaymentStatusEnum;
}
