import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class ScheduleByCourtQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by service ID',
    example: 101,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Filter by booking date (YYYY-MM-DD)',
    example: '2026-03-05',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
