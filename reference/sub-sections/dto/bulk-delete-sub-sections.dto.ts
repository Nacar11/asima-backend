import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class BulkDeleteSubSectionsDto {
  @ApiProperty({
    description: 'Array of sub-section IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one sub-section ID is required' })
  @ArrayMaxSize(100, {
    message: 'Maximum 100 sub-sections can be deleted at once',
  })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  ids: number[];
}
