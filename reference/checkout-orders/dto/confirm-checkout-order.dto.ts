import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for confirming a checkout order.
 */
export class ConfirmCheckoutOrderDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Payment method to use (e.g., gcash, paymaya, card)',
    example: 'gcash',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes for the order',
    example: 'Please contact me before delivery',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
