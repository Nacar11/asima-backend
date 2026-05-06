import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';
import { CreateAddonInclusionDto } from './create-addon-inclusion.dto';

export class CreateServiceAddonDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'Disinfectant Spraying' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ type: String, example: 'DISINFECTANT_SPRAY' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  short_description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'per order',
    description: 'Unit type (e.g., per order, per room, per balcony)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit_type?: string | null;

  @ApiProperty({ type: Number, example: 328.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ type: Number, example: 400.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compare_at_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_quantity?: number;

  @ApiPropertyOptional({ type: Number, example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_quantity?: number;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: AddonStatusEnum,
    default: AddonStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AddonStatusEnum)
  status?: AddonStatusEnum;

  @ApiPropertyOptional({
    type: [CreateAddonInclusionDto],
    description: 'List of inclusions (bullet points)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddonInclusionDto)
  inclusions?: CreateAddonInclusionDto[];
}
