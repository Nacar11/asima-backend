import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';

/**
 * DTO for creating a checkout order from shopping cart.
 *
 * Used when converting a shopping cart to a checkout order.
 * All fields are optional as they can be derived from the cart.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateCheckoutOrderDto {
  @ApiPropertyOptional({
    description:
      'Delivery address ID for product orders. If not provided, uses the default address.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  delivery_address_id?: number;

  @ApiPropertyOptional({
    description:
      'Service address ID for service orders. If not provided, uses the default address.',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    description: 'Customer notes for the order',
    example: 'Please leave at the front door',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_notes?: string;

  @ApiPropertyOptional({
    description: 'Source of the order',
    example: 'mobile_app',
    default: 'mobile_app',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
