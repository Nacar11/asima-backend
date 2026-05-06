import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAttributeDto {
  @ApiProperty({ example: 'Roast Level', description: 'Attribute name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: ['Light Roast', 'Medium Roast', 'Dark Roast'],
    description: 'Array of attribute values to create with the attribute',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attribute_values?: string[];

  @ApiPropertyOptional({
    example: 'Active',
    enum: ['Active', 'Inactive'],
    description: 'Attribute status',
  })
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}
