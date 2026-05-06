import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DragonPayStatusEnum } from '../enums/dragonpay-status.enum';
import { DragonPayCurrencyEnum } from '../enums/dragonpay-processor.enum';

/**
 * Postback/Webhook Callback DTO
 * Based on DragonPay Payment Switch API v2.26 Section 5.2.3
 */
export class PostbackCallbackDto {
  @ApiProperty({
    type: String,
    description: 'Merchant transaction ID',
    example: 'TXN-20260102-0001',
  })
  @IsString()
  txnid: string;

  @ApiProperty({
    type: String,
    description: 'DragonPay reference number',
    example: 'DPREF-20260102-ABC123',
  })
  @IsString()
  refno: string;

  @ApiProperty({
    enum: DragonPayStatusEnum,
    description:
      'Transaction status (S=Success, F=Failed, P=Pending, U=Unknown, V=Void)',
    example: DragonPayStatusEnum.SUCCESS,
  })
  @IsEnum(DragonPayStatusEnum)
  status: DragonPayStatusEnum;

  @ApiProperty({
    type: String,
    description: 'Status message',
    example: 'Transaction successful',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Transaction amount',
    example: 1000.0,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  amount?: number;

  @ApiPropertyOptional({
    enum: DragonPayCurrencyEnum,
    description: 'Currency code',
    example: DragonPayCurrencyEnum.PHP,
  })
  @IsOptional()
  @IsEnum(DragonPayCurrencyEnum)
  ccy?: DragonPayCurrencyEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'SHA1 digest (deprecated)',
  })
  @IsOptional()
  @IsString()
  digest?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'HMAC-SHA256 signature',
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'RSA-SHA256 signature',
  })
  @IsOptional()
  @IsString()
  signatures?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Settlement date (YYYY-MM-DD)',
    example: '2026-01-02',
  })
  @IsOptional()
  @IsString()
  settledate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 1',
  })
  @IsOptional()
  @IsString()
  param1?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 2',
  })
  @IsOptional()
  @IsString()
  param2?: string;
}
