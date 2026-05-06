import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for seller to request customer to reschedule a booking.
 *
 * Used when seller cannot fulfill the booking at the scheduled time
 * and needs to request the customer to choose a new time.
 */
export class RequestRescheduleDto {
  @ApiProperty({
    type: String,
    description: 'Reason why the seller is requesting reschedule',
    example: 'Unexpected scheduling conflict',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional suggested alternative dates/times',
    example: ['2025-01-15 09:00', '2025-01-16 14:00'],
  })
  @IsOptional()
  @IsString({ each: true })
  suggested_times?: string[];
}
