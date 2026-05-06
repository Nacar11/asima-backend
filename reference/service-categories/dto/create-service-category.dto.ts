import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @ApiProperty({ type: String, example: 'Cleaning' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ type: String, example: 'cleaning' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string | null;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number, example: 10.0, default: 10.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  default_platform_fee_percent?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta_title?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  meta_description?: string | null;
}
