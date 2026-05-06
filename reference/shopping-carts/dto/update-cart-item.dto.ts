import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for updating a cart item.
 *
 * Allows updating quantity and/or selection status.
 * At least one field must be provided.
 * Stock and minimum order validations are performed in the service layer.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateCartItemDto {
  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'New quantity for the cart item (must be at least 1)',
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether this item is selected for checkout',
  })
  @IsOptional()
  @IsBoolean({ message: 'is_selected must be a boolean' })
  is_selected?: boolean;
}
