import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateParameterDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @IsString()
  @ApiProperty({
    type: String,
    description: 'Parameter Code',
    example: 'TST001',
  })
  code: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Parameter item',
    example: 'test item',
  })
  param_items: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Parameter Description',
    example: 'Testing description',
  })
  description: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Parameter string value',
    example: 'String',
  })
  string_value: string;

  @IsNumber()
  @ApiProperty({
    type: Number,
    description: 'Parameter numeric value',
    example: 100.0,
  })
  numeric_value: number;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Parameter boolean value',
    example: true,
  })
  boolean_value: boolean;

  @IsDateString()
  @ApiProperty({
    type: Date,
    description: 'Parameter date value',
    example: '2025-01-20',
  })
  date_value: Date;
}
