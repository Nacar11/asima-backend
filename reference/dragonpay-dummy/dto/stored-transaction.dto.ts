import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DragonPayStatusEnum } from '../enums/dragonpay-status.enum';
import { DragonPayCurrencyEnum } from '../enums/dragonpay-processor.enum';

/**
 * Stored Transaction DTO
 * Represents a transaction stored in the dummy service
 */
export class StoredTransactionDto {
  @ApiProperty({
    type: String,
    description: 'Merchant transaction ID',
    example: 'TXN-20260102-0001',
  })
  txnid: string;

  @ApiProperty({
    type: String,
    description: 'DragonPay reference number',
    example: 'DPREF-20260102-ABC123',
  })
  refNo: string;

  @ApiProperty({
    type: Number,
    description: 'Transaction amount',
    example: 1000.0,
  })
  amount: number;

  @ApiProperty({
    enum: DragonPayCurrencyEnum,
    description: 'Currency code',
    example: DragonPayCurrencyEnum.PHP,
  })
  ccy: DragonPayCurrencyEnum;

  @ApiProperty({
    type: String,
    description: 'Transaction description',
    example: 'Payment for booking #123',
  })
  description: string;

  @ApiProperty({
    type: String,
    description: 'Customer email',
    example: 'customer@example.com',
  })
  email: string;

  @ApiProperty({
    enum: DragonPayStatusEnum,
    description: 'Transaction status',
    example: DragonPayStatusEnum.PENDING,
  })
  status: DragonPayStatusEnum;

  @ApiProperty({
    type: Date,
    description: 'Transaction creation date',
    example: '2026-01-02T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Processor ID',
    example: 'GCSH',
  })
  procId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Postback URL for webhook',
  })
  postbackUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Return URL after successful payment',
  })
  returnUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Cancel URL after cancelled payment',
  })
  cancelUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 1',
  })
  param1?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 2',
  })
  param2?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer mobile number',
    example: '09171234567',
  })
  mobileNo?: string;

  @ApiPropertyOptional({
    type: Date,
    description: 'Payment date',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Settlement date',
    example: '2026-01-03',
  })
  settleDate?: string;
}
