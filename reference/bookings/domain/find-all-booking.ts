import { ApiProperty } from '@nestjs/swagger';
import { Booking } from './booking';

/**
 * Find all bookings query result.
 *
 * Used for paginated responses when querying bookings.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllBooking {
  @ApiProperty({
    type: [Booking],
    description: 'Array of bookings',
  })
  data: Booking[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of bookings matching the query',
  })
  totalCount: number;
}
