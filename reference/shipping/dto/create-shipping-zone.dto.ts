import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AreaType } from '@/shipping/domain/enums/shipping.enum';

/**
 * DTO for creating a zone area
 */
export class CreateZoneAreaDto {
  @ApiProperty({
    enum: AreaType,
    example: AreaType.CITY,
    description: 'Type of area (country, region, province, city, postal_code)',
  })
  @IsEnum(AreaType)
  area_type: AreaType;

  @ApiProperty({
    type: String,
    example: 'Cebu City',
    description: 'Value of the area (e.g., city name, postal code)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area_value: string;
}

/**
 * DTO for creating a new shipping zone
 */
export class CreateShippingZoneDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'ID of the shipping provider',
  })
  @IsInt()
  provider_id: number;

  @ApiProperty({
    type: String,
    example: 'Metro Cebu',
    description: 'Name of the shipping zone',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Covers Cebu City and nearby areas',
    description: 'Description of the zone',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether this is the default zone (fallback)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether the zone is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Priority for zone matching (higher = checked first)',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    type: () => [CreateZoneAreaDto],
    description: 'Areas that belong to this zone',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateZoneAreaDto)
  @IsOptional()
  areas?: CreateZoneAreaDto[];
}
