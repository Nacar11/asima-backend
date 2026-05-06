import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationTypeEnum } from '../enums/notification-type.enum';

/**
 * Notification domain model.
 *
 * Represents a notification for a user about bookings, milestones,
 * payments, reviews, etc.
 *
 * @version 1
 * @since 1.0.0
 */
export class Notification {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Notification ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID',
  })
  user_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'User details',
  })
  user?: any;

  @ApiProperty({
    enum: NotificationTypeEnum,
    example: NotificationTypeEnum.BOOKING_CONFIRMED,
    description: 'Notification type',
  })
  type: NotificationTypeEnum;

  @ApiProperty({
    type: String,
    example: 'Booking Confirmed',
    description: 'Notification title',
  })
  title: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Your booking #BK-20241211-1234 has been confirmed.',
    description: 'Notification body',
    nullable: true,
  })
  body?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'booking',
    description: 'Related entity type',
    nullable: true,
  })
  entity_type?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Related entity ID',
    nullable: true,
  })
  entity_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: '/bookings/1',
    description: 'Deep link action URL',
    nullable: true,
  })
  action_url?: string | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When notification was read',
    nullable: true,
  })
  read_at?: Date | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether push notification was sent',
    default: false,
  })
  push_sent: boolean;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When push notification was sent',
    nullable: true,
  })
  push_sent_at?: Date | null;

  @ApiProperty({
    type: String,
    example: 'Active',
    description: 'Status',
    default: 'Active',
  })
  status: string;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @Exclude()
  __entity?: string;
}
