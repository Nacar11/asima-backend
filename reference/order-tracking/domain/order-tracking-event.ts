import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { OrderEventTypeEnum } from './event-type.enum';

/**
 * Order Tracking Event domain entity
 * Represents an immutable audit trail entry for order status changes
 */
export class OrderTrackingEvent {
  @ApiProperty({
    description: 'Event ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Sales order ID',
    example: 1,
  })
  order_id: number;

  @ApiProperty({
    description: 'Event type',
    enum: OrderEventTypeEnum,
    example: OrderEventTypeEnum.ORDER_PLACED,
  })
  event_type: OrderEventTypeEnum;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'Order has been placed successfully',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for this tracking event',
    example: 'Customer requested express handling',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Current location of package',
    example: 'Distribution Center, Manila',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'GPS latitude for real-time tracking',
    example: 14.5995,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'GPS longitude for real-time tracking',
    example: 120.9842,
  })
  longitude?: number;

  @ApiProperty({
    description: 'When the event occurred',
    example: '2025-11-23T00:00:00Z',
  })
  event_timestamp: Date;

  @ApiPropertyOptional({
    description: 'User who created this event',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
  })
  created_by?: Causer;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-23T00:00:00Z',
  })
  created_at: Date;

  @Exclude()
  __entity?: string;
}
