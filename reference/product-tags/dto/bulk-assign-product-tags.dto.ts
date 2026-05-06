import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAssignProductTagsDto {
  @ApiProperty({
    type: [Number],
    description: 'Product IDs to assign tags to (max 100)',
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100, {
    message: 'Maximum 100 products can be processed in bulk operation',
  })
  @Type(() => Number)
  @IsInt({ each: true })
  product_ids: number[];

  @ApiProperty({
    type: [Number],
    description: 'Tag IDs to assign (max 20 per product)',
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20, {
    message: 'Maximum 20 tags can be assigned at once',
  })
  @Type(() => Number)
  @IsInt({ each: true })
  tag_ids: number[];
}
