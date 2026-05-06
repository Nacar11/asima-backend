import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

/**
 * Order item for email notification display.
 */
export class NotificationOrderItemDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({ description: 'Variant name' })
  @IsOptional()
  @IsString()
  variant_name?: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Total price for this item' })
  @IsOptional()
  total_price?: number;
}

/**
 * Return item for email notification display.
 */
export class NotificationReturnItemDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({ description: 'Variant name' })
  @IsOptional()
  @IsString()
  variant_name?: string;

  @ApiPropertyOptional({ description: 'Product image URL' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Quantity being returned' })
  @IsOptional()
  @IsInt()
  quantity_returning?: number;

  @ApiPropertyOptional({ description: 'Original quantity ordered' })
  @IsOptional()
  @IsInt()
  quantity_ordered?: number;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Return amount for this item' })
  @IsOptional()
  return_amount?: number;
}

export interface OrderNotificationDetails {
  orderItems?: NotificationOrderItemDto[];
  subtotal?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAddress?: string;
  sellerName?: string;
  totalAmount?: number;
  estimatedDelivery?: string;
}

export interface ReturnNotificationDetails {
  returnItems?: NotificationReturnItemDto[];
  refundAmount?: number;
  returnReason?: string;
  orderNumber?: string;
  sellerName?: string;
}

/**
 * DTO for creating a notification.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  user_id: number;

  @ApiProperty({
    description: 'Notification type',
    example: NotificationTypeEnum.BOOKING_CONFIRMED,
    enum: NotificationTypeEnum,
  })
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @ApiProperty({
    description: 'Notification title',
    example: 'Booking Confirmed',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Notification body',
    example: 'Your booking #BK-20241211-1234 has been confirmed.',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Related entity type',
    example: 'booking',
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Related entity ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  entity_id?: number;

  @ApiPropertyOptional({
    description: 'Deep link action URL',
    example: '/bookings/1',
  })
  @IsOptional()
  @IsString()
  action_url?: string;

  @ApiPropertyOptional({
    description: 'Whether to send push notification',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  send_push?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to send email notification',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  send_email?: boolean;

  @ApiPropertyOptional({
    description: 'User email address for email notifications',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  user_email?: string;

  @ApiPropertyOptional({
    description: 'User name for email notifications',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  user_name?: string;

  @ApiPropertyOptional({
    description: 'Payment amount for payment notification emails',
    example: 1000,
  })
  @IsOptional()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  // Order-specific fields for rich email notifications
  @ApiPropertyOptional({ description: 'Order number for display' })
  @IsOptional()
  @IsString()
  order_number?: string;

  @ApiPropertyOptional({ description: 'Order items for detailed display' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationOrderItemDto)
  order_items?: NotificationOrderItemDto[];

  @ApiPropertyOptional({ description: 'Subtotal before fees/discounts' })
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Shipping amount' })
  @IsOptional()
  shipping_amount?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Shipping address for display' })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  tracking_number?: string;

  @ApiPropertyOptional({ description: 'Shipping provider/carrier' })
  @IsOptional()
  @IsString()
  shipping_provider?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsOptional()
  @IsString()
  estimated_delivery?: string;

  @ApiPropertyOptional({ description: 'Seller/store name' })
  @IsOptional()
  @IsString()
  seller_name?: string;

  @ApiPropertyOptional({
    description: 'Customer name (for seller notifications)',
  })
  @IsOptional()
  @IsString()
  customer_name?: string;

  // Return-specific fields for rich email notifications
  @ApiPropertyOptional({ description: 'Return request number' })
  @IsOptional()
  @IsString()
  return_number?: string;

  @ApiPropertyOptional({ description: 'Return items for detailed display' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationReturnItemDto)
  return_items?: NotificationReturnItemDto[];

  @ApiPropertyOptional({ description: 'Total return/refund amount' })
  @IsOptional()
  refund_amount?: number;

  @ApiPropertyOptional({ description: 'Return reason' })
  @IsOptional()
  @IsString()
  return_reason?: string;

  @ApiPropertyOptional({ description: 'Pickup address for returns' })
  @IsOptional()
  @IsString()
  pickup_address?: string;

  @ApiPropertyOptional({ description: 'Scheduled pickup date' })
  @IsOptional()
  @IsString()
  pickup_date?: string;
}
