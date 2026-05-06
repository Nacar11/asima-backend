import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { SalesReportGranularityEnum } from '@/seller/sales-report/domain/sales-report-granularity.enum';

export class QuerySalesReportDto {
  @ApiPropertyOptional({
    description: 'Start date (inclusive) in ISO format (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date (inclusive) in ISO format (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    enum: SalesReportGranularityEnum,
    description:
      'Chart granularity override (daily/weekly/monthly). If omitted, server derives it from the date range.',
    example: SalesReportGranularityEnum.DAILY,
  })
  @IsOptional()
  @IsEnum(SalesReportGranularityEnum)
  granularity?: SalesReportGranularityEnum;

  @ApiPropertyOptional({
    description: 'Sort direction for top tables (ASC or DESC). Default: DESC',
    example: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'ASC' | 'DESC';
}
