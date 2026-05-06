import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignTagsDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of tag IDs to assign (max 20 per product)',
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20, {
    message: 'Maximum 20 tags can be assigned to a product',
  })
  @Type(() => Number)
  @IsInt({ each: true })
  tag_ids: number[];
}
