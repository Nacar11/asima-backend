import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LoggerLevel } from '@/loggers/loggers.enum';

/**
 * DTO for querying logs.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryLogsDto {
  @ApiPropertyOptional({
    enum: LoggerLevel,
    description: 'Filter by log level',
  })
  @IsOptional()
  @IsEnum(LoggerLevel)
  level?: LoggerLevel;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Start date for filtering logs',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'End date for filtering logs',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by user ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by endpoint',
  })
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum number of logs to return',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
