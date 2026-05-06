import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { BookingStatusEnum } from '../enums/booking-status.enum';

/**
 * Export format enum for booking exports.
 */
export enum ExportFormatEnum {
  CSV = 'csv',
  JSON = 'json',
}

/**
 * DTO for exporting booking history.
 *
 * Allows filtering bookings by date range, status, and format.
 */
export class ExportBookingsDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Start date for export range (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'End date for export range (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: BookingStatusEnum,
    description: 'Filter by booking status',
  })
  @IsOptional()
  @IsEnum(BookingStatusEnum)
  status?: BookingStatusEnum;

  @ApiPropertyOptional({
    enum: ExportFormatEnum,
    description: 'Export format',
    default: ExportFormatEnum.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormatEnum)
  format?: ExportFormatEnum;
}
