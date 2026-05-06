import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class BulkDeleteSectionsDto {
  @ApiProperty({
    description: 'Array of section IDs to delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one section ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 sections can be deleted at once' })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  ids: number[];
}
