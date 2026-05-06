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
import { Type } from 'class-transformer';
import { OptionValueStatusEnum } from '@/service-option-values/enums/option-value-status.enum';

export class CreateServiceOptionValueDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  option_group_id: number;

  @ApiProperty({ type: String, example: 'Condo (20-60 sqm)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({ type: String, example: 'condo' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  value: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  price_adjustment?: number;

  @ApiPropertyOptional({ type: Number, example: 1.0, default: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price_multiplier?: number;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  duration_adjustment_minutes?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string | null;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: OptionValueStatusEnum,
    default: OptionValueStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(OptionValueStatusEnum)
  status?: OptionValueStatusEnum;
}
