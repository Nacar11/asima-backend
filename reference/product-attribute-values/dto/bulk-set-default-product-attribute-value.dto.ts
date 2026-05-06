import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for bulk setting product attribute values as default.
 * Each ID must belong to a different product_attribute_id group.
 */
export class BulkSetDefaultProductAttributeValueDto {
  @ApiProperty({
    description:
      'Array of product attribute value IDs to set as default. ' +
      'Each ID must belong to a different product_attribute_id group.',
    example: [1, 5, 12],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
