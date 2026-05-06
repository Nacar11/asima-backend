import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Retry Payment DTO
 * Used to retry payment for a PENDING order
 */
export class RetryPaymentDto {
  @ApiPropertyOptional({
    description: 'Client IP address for payment gateway (optional)',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
