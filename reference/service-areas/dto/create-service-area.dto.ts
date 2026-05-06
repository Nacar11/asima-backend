import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import {
  IsPhilippinesLatitude,
  IsPhilippinesLongitude,
  PHILIPPINES_BOUNDS,
} from '@/service-areas/validators/philippines-coordinates.validator';

export class CreateServiceAreaDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiPropertyOptional({ type: String, example: 'Quezon City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ type: String, example: 'Metro Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string | null;

  @ApiPropertyOptional({ type: String, example: '1100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string | null;

  @ApiPropertyOptional({ type: String, example: 'Bagong Pag-asa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barangay?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5995,
    description: `Latitude must be within the Philippines (${PHILIPPINES_BOUNDS.minLat}° to ${PHILIPPINES_BOUNDS.maxLat}°)`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPhilippinesLatitude()
  center_latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 120.9842,
    description: `Longitude must be within the Philippines (${PHILIPPINES_BOUNDS.minLng}° to ${PHILIPPINES_BOUNDS.maxLng}°)`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPhilippinesLongitude()
  center_longitude?: number | null;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  radius_km?: number | null;

  @ApiProperty({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  additional_fee_amount?: number | null;

  @ApiProperty({
    enum: AdditionalFeeTypeEnum,
    default: AdditionalFeeTypeEnum.FIXED,
  })
  @IsEnum(AdditionalFeeTypeEnum)
  additional_fee_type: AdditionalFeeTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimum_order_amount?: number | null;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
