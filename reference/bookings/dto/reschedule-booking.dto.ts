import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Matches, Min } from 'class-validator';

/**
 * DTO for rescheduling a booking to a new date/time.
 */
export class RescheduleBookingDto {
  @ApiProperty({
    type: String,
    description: 'New scheduled date in YYYY-MM-DD format',
    example: '2025-01-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'scheduled_date must be in YYYY-MM-DD format',
  })
  scheduled_date: string;

  @ApiProperty({
    type: String,
    description: 'New scheduled start time in HH:mm or HH:mm:ss format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'scheduled_time must be in HH:mm or HH:mm:ss format',
  })
  scheduled_time: string;

  @ApiPropertyOptional({
    type: String,
    description: 'New scheduled end time in HH:mm or HH:mm:ss format',
    example: '11:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'scheduled_end_time must be in HH:mm or HH:mm:ss format',
  })
  scheduled_end_time?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'New service address ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  service_address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Target service/court ID for reschedule. If omitted, keeps the original booking service.',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  service_id?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Reason for rescheduling',
    example: 'Customer requested different time',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
