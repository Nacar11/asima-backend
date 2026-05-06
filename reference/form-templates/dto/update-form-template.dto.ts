import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormFieldTypeEnum } from '@/form-templates/enums/form-field-type.enum';
import { CreateValidationRuleDto } from './create-validation-rule.dto';
import { CreateOptionDto } from './create-option.dto';

export class UpdateValidationRuleDto extends CreateValidationRuleDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;
}

export class UpdateOptionDto extends CreateOptionDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;
}

export class UpdateFormTemplateDto {
  @ApiPropertyOptional({ type: String, example: 'Quantity' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'quantity' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({
    type: String,
    enum: FormFieldTypeEnum,
    example: FormFieldTypeEnum.NUMBER,
  })
  @IsOptional()
  @IsEnum(FormFieldTypeEnum)
  field_type?: FormFieldTypeEnum;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ type: String, example: 'Enter quantity' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string | null;

  @ApiPropertyOptional({ type: String, example: 'How many items do you need?' })
  @IsOptional()
  @IsString()
  help_text?: string | null;

  @ApiPropertyOptional({ type: String, example: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  default_value?: string | null;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sequence_order?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: [UpdateValidationRuleDto],
    description: 'Validation rules for the field',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateValidationRuleDto)
  validation_rules?: UpdateValidationRuleDto[];

  @ApiPropertyOptional({
    type: [UpdateOptionDto],
    description: 'Options for dropdown/radio/checkbox fields',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  options?: UpdateOptionDto[];
}
