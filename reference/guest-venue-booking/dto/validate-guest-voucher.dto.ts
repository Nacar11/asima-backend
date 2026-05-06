import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateVenueVoucherDto {
  @ApiProperty({
    description: 'Voucher code from the vouchers table',
    example: 'COFFEEB1T1',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    type: [Number],
    description: 'Service IDs to check eligibility against',
    example: [1, 2],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids: number[];

  @ApiProperty({
    description: 'Total booking amount for discount calculation',
    example: 500.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiPropertyOptional({
    type: [Number],
    description:
      'User voucher IDs already in use (so the backend picks a different one)',
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  exclude_user_voucher_ids?: number[];
}

export class ValidateVenueVoucherResponseDto {
  @ApiProperty() valid: boolean;
  // Mirror of `valid` — kept because mobile clients deserialize the
  // shared customer voucher response shape that uses `is_elligible` (sic).
  @ApiProperty() is_elligible: boolean;
  @ApiProperty() message: string;
  @ApiPropertyOptional() voucher_id?: number;
  @ApiPropertyOptional() user_voucher_id?: number;
  @ApiPropertyOptional() voucher_code?: string;
  @ApiPropertyOptional() discount_type?: string;
  @ApiPropertyOptional() discount_value?: number;
  @ApiPropertyOptional({ type: [Number] }) eligible_service_ids?: number[];
  @ApiPropertyOptional() hourly_rate?: number;
  @ApiPropertyOptional() discount_amount?: number;
  @ApiPropertyOptional() final_amount?: number;
}
