import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, Min } from 'class-validator';

/**
 * Input for evaluating all claimed vouchers against selected checkout variants.
 */
export class ValidateVoucherEligibilityDto {
  @ApiProperty({
    type: [Number],
    example: [101, 102],
    description: 'Selected product variant IDs from checkout preview',
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  variant_ids: number[];
  @ApiProperty({
    type: Number,
    example: 1250,
    description: 'Checkout subtotal used for minimum-order validation',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;
}
