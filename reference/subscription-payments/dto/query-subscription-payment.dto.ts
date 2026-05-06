import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';

export class QuerySubscriptionPaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SubscriptionPaymentStatusEnum })
  @IsOptional()
  @IsEnum(SubscriptionPaymentStatusEnum)
  payment_status?: SubscriptionPaymentStatusEnum;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subscription_id?: number;

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
}
