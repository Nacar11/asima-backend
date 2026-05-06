import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  Min,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for adding an item to the shopping cart.
 *
 * Validates that the variant_id and quantity are valid integers.
 * Quantity must be at least 1. Stock and minimum order validations
 * are performed in the service layer.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddCartItemDto {
  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Product variant ID to add to cart',
  })
  @IsNotEmpty({ message: 'Variant ID is required' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Variant ID must be an integer' })
  @IsPositive({ message: 'Variant ID must be a positive number' })
  variant_id: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Quantity to add (must be at least 1)',
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether this item is selected for checkout',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_selected must be a boolean' })
  is_selected?: boolean = false;
}
