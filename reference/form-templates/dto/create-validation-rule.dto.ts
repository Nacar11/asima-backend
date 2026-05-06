import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ValidationRuleTypeEnum } from '@/form-templates/enums/validation-rule-type.enum';

export class CreateValidationRuleDto {
  @ApiProperty({
    type: String,
    enum: ValidationRuleTypeEnum,
    example: ValidationRuleTypeEnum.MIN,
  })
  @IsNotEmpty()
  @IsEnum(ValidationRuleTypeEnum)
  rule_type: ValidationRuleTypeEnum;

  @ApiProperty({ type: String, example: '1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  rule_value: string;

  @ApiPropertyOptional({ type: String, example: 'Value must be at least 1' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  error_message?: string | null;
}
