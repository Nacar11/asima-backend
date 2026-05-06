import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkDeleteCategoriesDto {
  @ApiProperty({
    description: 'Array of category IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: number[];
}
