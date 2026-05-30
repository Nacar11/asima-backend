import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryPendingApprovalsDto {
  @ApiPropertyOptional({
    enum: ['leave', 'time_correction'],
    description: 'Filter the inbox to one request kind. Omit for all kinds.',
  })
  @IsOptional()
  @IsIn(['leave', 'time_correction'])
  type?: 'leave' | 'time_correction';

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
