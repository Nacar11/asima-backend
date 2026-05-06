import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for processing payment callback/webhook.
 *
 * Used when receiving payment status updates from payment gateway.
 *
 * @version 1
 * @since 1.0.0
 */
export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Gateway transaction ID',
    example: 'pay_abc123xyz',
  })
  @IsString()
  gateway_transaction_id: string;

  @ApiPropertyOptional({
    description: 'Gateway reference number',
    example: 'REF123456',
  })
  @IsOptional()
  @IsString()
  gateway_reference_number?: string;

  @ApiPropertyOptional({
    description: 'Full gateway response (JSON)',
    example: { status: 'paid', amount: 5000 },
  })
  @IsOptional()
  @IsObject()
  gateway_response?: any;
}
