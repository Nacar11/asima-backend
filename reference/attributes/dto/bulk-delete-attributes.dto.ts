import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkDeleteAttributesDto {
  @ApiProperty({
    description: 'Array of attribute IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: number[];
}
