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
 * Query membership plans DTO.
 */
export class QueryMembershipPlanDto {
  @ApiProperty({
    description: 'Filter by plan code',
    example: 'starter',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  plan_code?: string;

  @ApiProperty({
    description: 'Filter by plan name',
    example: 'Starter',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  plan_name?: string;

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
