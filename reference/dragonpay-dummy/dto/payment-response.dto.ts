import { ApiProperty } from '@nestjs/swagger';

/**
 * Payment Response DTO
 * Response from creating a payment request
 */
export class PaymentResponseDto {
  @ApiProperty({
    type: String,
    description: 'DragonPay reference number',
    example: 'DPREF-20260102-ABC123',
  })
  refNo: string;

  @ApiProperty({
    type: String,
    description: 'Payment URL to redirect customer',
    example: 'https://test.dragonpay.ph/Pay.aspx?txnid=TXN-123',
  })
  url: string;

  @ApiProperty({
    type: String,
    description: 'Response message',
    example: 'Transaction created successfully',
  })
  message: string;
}
