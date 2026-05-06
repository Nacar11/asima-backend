import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReturnRequestStatusEnum } from '../domain/return-request-status.enum';

/**
 * DevExtreme-compatible query DTO for return requests
 * Standalone DTO (not extending BaseGetDto to avoid JSON.parse issues)
 */
export class QueryReturnRequestDevExtremeDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to return',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of records to skip',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Record sorting',
    example: '[{"selector":"created_at","desc":true}]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '') return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  sort?: { selector: string; desc: boolean }[];

  @ApiPropertyOptional({
    type: String,
    description: 'Record filtering',
    example: '["status","=","PENDING"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '') return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  filter?: (string | string[])[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'DevExtreme: Whether to return total count',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requireTotalCount?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Search operation type',
    example: 'contains',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/"/g, '') : value,
  )
  @IsString()
  searchOperation?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Search expression (field to search)',
    example: 'reason',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/"/g, '') : value,
  )
  @IsString()
  searchExpr?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Search value',
    example: 'damaged',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/"/g, '') : value,
  )
  @IsString()
  searchValue?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (additional filter)',
    enum: ReturnRequestStatusEnum,
  })
  @IsOptional()
  @IsEnum(ReturnRequestStatusEnum)
  status?: ReturnRequestStatusEnum;
}
