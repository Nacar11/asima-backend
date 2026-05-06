import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying available dates for a service.
 *
 * Used to get a range of dates that have available slots.
 *
 * @version 1
 * @since 1.0.0
 */
export class GetServiceAvailableDatesDto {
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2025-12-15',
    description: 'Start date of the range (YYYY-MM-DD)',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2025-12-31',
    description: 'End date of the range (YYYY-MM-DD)',
  })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description:
      'Optional package ID to check availability for specific package',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  package_id?: number;
}
