import { ApiProperty } from '@nestjs/swagger';
import { Notification } from './notification';

/**
 * Result of finding all notifications with pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllNotification {
  @ApiProperty({
    type: [Notification],
    description: 'List of notifications',
  })
  data: Notification[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of notifications',
  })
  totalCount: number;
}
