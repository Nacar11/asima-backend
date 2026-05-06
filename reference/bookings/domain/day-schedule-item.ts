import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Day Schedule Item domain model.
 *
 * Represents an item in a day's schedule (booking or unavailability).
 *
 * @version 1
 * @since 1.0.0
 */
export class DayScheduleItem {
  @ApiProperty({
    type: String,
    enum: ['booking', 'unavailability'],
    example: 'booking',
  })
  type: 'booking' | 'unavailability';

  @ApiProperty({ type: String, example: '09:00:00' })
  start_time: string;

  @ApiProperty({ type: String, example: '11:00:00' })
  end_time: string;

  @ApiProperty({ type: String, example: 'Plumbing Service' })
  title: string;

  @ApiPropertyOptional({ type: String, example: 'Customer: John Doe' })
  subtitle?: string | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  booking_id?: number | null;

  @ApiPropertyOptional({ type: String, example: 'confirmed' })
  status?: string | null;
}
