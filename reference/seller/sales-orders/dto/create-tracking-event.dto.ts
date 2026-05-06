import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';

/**
 * Allowed event types for manual seller tracking entry
 * Restricted to exception/problem reporting only to prevent abuse
 * Sellers cannot report delivery progress (e.g., out_for_delivery)
 */
export const SELLER_ALLOWED_EVENT_TYPES = [
  OrderEventTypeEnum.DELIVERY_EXCEPTION,
  OrderEventTypeEnum.EXCEPTION,
] as const;

/**
 * DTO for creating manual tracking events by sellers
 */
export class CreateTrackingEventDto {
  @ApiProperty({
    description:
      'Event type. Sellers can only report exceptions/problems, not delivery progress.',
    enum: SELLER_ALLOWED_EVENT_TYPES,
    example: OrderEventTypeEnum.DELIVERY_EXCEPTION,
  })
  @IsEnum(OrderEventTypeEnum, {
    message: `Event type must be one of: ${SELLER_ALLOWED_EVENT_TYPES.join(', ')}`,
  })
  event_type: OrderEventTypeEnum;

  @ApiPropertyOptional({
    description: 'Optional description for the event',
    example: 'Delivery attempt failed - customer not available',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Current location of the package',
    example: 'Distribution Center, Manila',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'GPS latitude for real-time tracking',
    example: 14.5995,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'GPS longitude for real-time tracking',
    example: 120.9842,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for this tracking event',
    example: 'Customer requested callback before next attempt',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
