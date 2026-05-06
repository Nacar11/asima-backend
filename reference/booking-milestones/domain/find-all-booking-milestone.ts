import { ApiProperty } from '@nestjs/swagger';
import { BookingMilestone } from './booking-milestone';

/**
 * Find all booking milestones query result.
 *
 * Used for paginated responses when querying booking milestones.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllBookingMilestone {
  @ApiProperty({
    type: [BookingMilestone],
    description: 'Array of booking milestones',
  })
  data: BookingMilestone[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of booking milestones matching the query',
  })
  totalCount: number;
}
