import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

class ValidateVoucherVariantDto {
  @ApiProperty({
    type: Number,
    example: 101,
    description: 'Product variant ID included in the checkout cart',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variant_id: number;
  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Quantity for this variant in the checkout cart',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;
}

/**
 * DTO for validating vouchers against checkout context.
 */
export class ValidateVoucherDto {
  @ApiProperty({
    type: [Number],
    example: [10, 22],
    description:
      'Voucher IDs evaluated sequentially for stacking in the checkout flow',
  })
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  vouchers: number[];
  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Shipping fee for current checkout, separate from subtotal',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shipping_fee: number;
  @ApiPropertyOptional({
    type: [ValidateVoucherVariantDto],
    description:
      'Variants included in checkout cart. applicable_subtotal is derived from sum(variant selling price * quantity)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidateVoucherVariantDto)
  variants?: ValidateVoucherVariantDto[];
  @ApiPropertyOptional({
    type: [Number],
    example: [55, 81],
    description: 'Service IDs included in current checkout cart',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids?: number[];
}
