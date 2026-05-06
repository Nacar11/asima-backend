import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @ApiProperty({ type: String, example: 'Small' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({ type: String, example: 'small' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  value: string;

  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sequence_order?: number;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
