import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BulkTagAction {
  DELETE = 'delete',
  MERGE = 'merge',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
}

export class BulkTagOperationDto {
  @ApiProperty({
    type: [Number],
    description: 'Tag IDs to operate on (max 100)',
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100, {
    message: 'Maximum 100 tags can be processed in bulk operation',
  })
  @Type(() => Number)
  @IsInt({ each: true })
  tag_ids: number[];

  @ApiProperty({
    enum: BulkTagAction,
    description: 'Bulk operation action',
    example: BulkTagAction.DELETE,
  })
  @IsEnum(BulkTagAction)
  action: BulkTagAction;

  @ApiPropertyOptional({
    type: Number,
    description: 'Target tag ID for merge operations',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  target_tag_id?: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Target product IDs for assign/unassign operations',
    example: [101, 102, 103],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  target_product_ids?: number[];
}
