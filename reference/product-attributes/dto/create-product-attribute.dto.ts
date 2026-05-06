import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductAttributeDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 1, description: 'Attribute ID' })
  @IsNumber()
  @IsNotEmpty()
  attribute_id: number;

  @ApiProperty({
    example: [1, 2, 4],
    description:
      'Array of attribute value IDs. Each ID must belong to the specified attribute and seller. For example, if attribute_id is 1 (Color), these IDs could be [1, 2, 4] representing [Black, White, Blue] color options.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  attribute_value_ids?: number[];
}
