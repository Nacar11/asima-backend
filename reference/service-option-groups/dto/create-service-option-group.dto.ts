import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionGroupInputTypeEnum } from '@/service-option-groups/enums/option-group-input-type.enum';
import { OptionGroupStatusEnum } from '@/service-option-groups/enums/option-group-status.enum';

export class CreateServiceOptionGroupDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'What is your home type?' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ type: String, example: 'home_type' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    type: String,
    enum: OptionGroupInputTypeEnum,
    default: OptionGroupInputTypeEnum.SELECT,
  })
  @IsOptional()
  @IsEnum(OptionGroupInputTypeEnum)
  input_type?: OptionGroupInputTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_value?: number | null;

  @ApiPropertyOptional({ type: Number, example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_value?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  default_value?: number | null;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: OptionGroupStatusEnum,
    default: OptionGroupStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(OptionGroupStatusEnum)
  status?: OptionGroupStatusEnum;
}
