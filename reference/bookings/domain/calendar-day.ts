import { ApiProperty } from '@nestjs/swagger';

/**
 * Calendar Day domain model.
 *
 * Represents a day in the calendar with booking count and availability info.
 *
 * @version 1
 * @since 1.0.0
 */
export class CalendarDay {
  @ApiProperty({ type: String, example: '2024-12-25' })
  date: string;

  @ApiProperty({ type: Number, example: 3 })
  bookings_count: number;

  @ApiProperty({ type: Boolean, example: false })
  has_unavailability: boolean;

  @ApiProperty({ type: Boolean, example: false })
  is_today: boolean;

  @ApiProperty({ type: Boolean, example: false })
  is_selected: boolean;
}
