import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceOptionPricingRuleConditionDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  option_group_id: number;

  @ApiProperty({ type: Number, example: 5 })
  @Type(() => Number)
  @IsInt()
  option_value_id: number;
}

export class CreateServiceOptionPricingRuleDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: 'Premium Large' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ type: String, example: 'premium_large' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  code: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: Number, example: 200 })
  @Type(() => Number)
  price_adjustment: number;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  duration_adjustment_minutes?: number;

  @ApiPropertyOptional({ type: Number, example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    type: () => [CreateServiceOptionPricingRuleConditionDto],
    description:
      'Exact option combination that triggers this rule (one condition per option group)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOptionPricingRuleConditionDto)
  conditions: CreateServiceOptionPricingRuleConditionDto[];
}
