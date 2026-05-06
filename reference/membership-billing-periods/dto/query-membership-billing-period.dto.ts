import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query membership billing periods DTO.
 */
export class QueryMembershipBillingPeriodDto {
  @ApiProperty({
    description: 'Filter by period code',
    example: 'monthly',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  period_code?: string;

  @ApiProperty({
    description: 'Filter by period name',
    example: 'Monthly',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  period_name?: string;

  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiProperty({
    description: 'Number of records to skip for pagination',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @ApiProperty({
    description: 'Number of records to take',
    example: 40,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  take?: number;

  @ApiProperty({
    description: 'Sort order (ASC or DESC)',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: 'ASC' | 'DESC';
}
