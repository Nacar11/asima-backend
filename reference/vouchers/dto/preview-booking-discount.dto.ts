import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for previewing voucher discount on a booking (no redemption).
 */
export class PreviewBookingDiscountDto {
  @ApiProperty({
    description: 'Voucher codes to apply (stacked)',
    example: ['PICKLE-FREE-001', 'PICKLE-FREE-002'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  voucher_codes: string[];

  @ApiProperty({ description: 'Service ID', example: 42 })
  @IsInt()
  @IsPositive()
  service_id: number;

  @ApiProperty({ description: 'Booking subtotal', example: 1000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    description:
      'Number of booked slots/hours (venue services). Required for per_hours discount type to calculate correct per-slot discount.',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  num_slots?: number;

  @ApiPropertyOptional({
    description:
      'Total price of selected add-ons. When the voucher has include_addons_flag=false the discount is computed on (subtotal - addons_total) only.',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  addons_total?: number;
}
