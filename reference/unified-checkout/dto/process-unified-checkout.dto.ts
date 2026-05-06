import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for processing unified checkout.
 */
export class ProcessUnifiedCheckoutDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Delivery address ID for products',
  })
  @IsOptional()
  @IsInt()
  delivery_address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Default service address ID for services',
  })
  @IsOptional()
  @IsInt()
  service_address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Shipping method ID for products',
  })
  @IsOptional()
  @IsInt()
  shipping_method_id?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Payment method (e.g., dragonpay, paymongo, cod)',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer notes for the order',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Idempotency key to prevent duplicate orders',
  })
  @IsOptional()
  @IsUUID()
  idempotency_key?: string;
}
