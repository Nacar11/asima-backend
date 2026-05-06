import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
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

export class CreateFormTemplateDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'Quantity' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ type: String, example: 'quantity' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    type: String,
    enum: FormFieldTypeEnum,
    example: FormFieldTypeEnum.NUMBER,
  })
  @IsNotEmpty()
  @IsEnum(FormFieldTypeEnum)
  field_type: FormFieldTypeEnum;

  @ApiPropertyOptional({ type: Boolean, default: false })
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

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sequence_order?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: [CreateValidationRuleDto],
    description: 'Validation rules for the field',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateValidationRuleDto)
  validation_rules?: CreateValidationRuleDto[];

  @ApiPropertyOptional({
    type: [CreateOptionDto],
    description: 'Options for dropdown/radio/checkbox fields',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
