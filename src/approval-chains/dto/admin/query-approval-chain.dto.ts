import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class QueryApprovalChainDto {
  @ApiPropertyOptional({ description: 'Match on employee name or email.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'When true, return only employees with no active L1 approver.',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unassigned?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
