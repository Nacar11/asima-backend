import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payout Status Response DTO
 * Mirrors DragonPayV2RawPayoutStatusResponse — the PascalCase shape
 * returned by GET {payoutUrl}/{merchantId}/{txnId}
 */
export class PayoutStatusResponseDto {
  @ApiProperty({
    description: 'DragonPay reference number',
    example: 'DPREF-20260212-ABCD1234',
  })
  RefNo: string;

  @ApiProperty({ description: 'Merchant ID', example: 'TRAVAJO_TEST' })
  MerchantId: string;

  @ApiProperty({
    description: 'Merchant transaction ID',
    example: 'TXN-M2QX1-ABC123',
  })
  MerchantTxnId: string;

  @ApiProperty({ description: 'Payout amount', example: 500 })
  Amount: number;

  @ApiProperty({ description: 'Currency code', example: 'PHP' })
  Currency: string;

  @ApiProperty({ description: 'Description', example: 'Refund for order #123' })
  Description: string;

  @ApiProperty({
    description: 'Transaction status (S/F/P/H/G/V)',
    example: 'P',
  })
  Status: string;

  @ApiPropertyOptional({ description: 'Processor ID', example: 'BOG' })
  ProcId?: string;

  @ApiPropertyOptional({
    description: 'Processor detail (account number)',
    example: '1234567890',
  })
  ProcDetail?: string;

  @ApiPropertyOptional({ description: 'Processing message' })
  ProcMsg?: string;

  @ApiPropertyOptional({
    description: 'Settlement date',
    example: '2026-02-13',
  })
  SettleDate?: string;

  @ApiPropertyOptional({ description: 'Service fee', example: 15 })
  Fee?: number;
}
