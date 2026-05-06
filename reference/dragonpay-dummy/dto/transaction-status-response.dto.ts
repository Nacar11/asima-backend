import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DragonPayStatusEnum } from '../enums/dragonpay-status.enum';
import { DragonPayCurrencyEnum } from '../enums/dragonpay-processor.enum';

/**
 * Transaction Status Response DTO
 * Based on DragonPay Payment Switch API v2.26 Section 5.3.1
 */
export class TransactionStatusResponseDto {
  @ApiProperty({
    type: String,
    description: 'DragonPay reference number',
    example: 'DPREF-20260102-ABC123',
  })
  refNo: string;

  @ApiProperty({
    type: String,
    description: 'Merchant ID',
    example: 'TESTMERCHANT',
  })
  merchantId: string;

  @ApiProperty({
    type: String,
    description: 'Merchant transaction ID',
    example: 'TXN-20260102-0001',
  })
  txnid: string;

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
    enum: DragonPayStatusEnum,
    description: 'Transaction status',
    example: DragonPayStatusEnum.SUCCESS,
  })
  status: DragonPayStatusEnum;

  @ApiProperty({
    type: String,
    description: 'Transaction date',
    example: '2026-01-02T10:30:00.000Z',
  })
  date: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Processor ID used',
    example: 'GCSH',
  })
  procId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Processor message',
    example: 'Payment processed successfully',
  })
  procMsg?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Settlement date',
    example: '2026-01-03',
  })
  settleDate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Secondary reference number',
  })
  refNo2?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer mobile number',
    example: '09171234567',
  })
  mobileNo?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Transaction fee',
    example: 25.0,
  })
  fee?: number;
}
