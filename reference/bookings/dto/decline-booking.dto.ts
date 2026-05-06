import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO for declining a booking.
 *
 * Used by sellers to decline a pending booking with a reason.
 * Requires a mandatory reason for the decline.
 *
 * @version 1
 * @since 1.0.0
 */
export class DeclineBookingDto {
  @ApiProperty({
    type: String,
    description: 'Reason for declining the booking',
    example: 'Schedule conflict - not available on requested date',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes for the customer',
    example: 'Please try rebooking for next week',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
