import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for retrying a failed payment.
 *
 * @version 1
 * @since 1.0.0
 */
export class RetryPaymentDto {
  @ApiPropertyOptional({
    description: 'Reason for payment retry',
    example: 'Payment gateway issue resolved',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
