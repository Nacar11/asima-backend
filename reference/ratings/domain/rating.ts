import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Rating domain model.
 *
 * Represents a customer rating/review for a completed booking.
 *
 * @version 1
 * @since 1.0.0
 */
export class Rating {
  @ApiProperty({ description: 'Rating ID' })
  id: number;

  @ApiProperty({ description: 'Booking ID this rating belongs to' })
  booking_id: number;

  @ApiProperty({ description: 'Sales Order ID' })
  sales_order_id: number;

  @ApiProperty({ description: 'Customer user ID who submitted the rating' })
  customer_id: number;

  @ApiProperty({ description: 'Seller ID being rated' })
  seller_id: number;

  @ApiPropertyOptional({ description: 'Service ID if rating a service' })
  service_id: number | null;

  @ApiProperty({ description: 'Overall average rating (calculated)' })
  overall_rating: number;

  @ApiPropertyOptional({ description: 'Additional review comment' })
  review_comment: string | null;

  @ApiProperty({ description: 'Whether this rating is visible publicly' })
  is_public: boolean;

  @ApiProperty({ description: 'Whether seller has responded' })
  has_seller_response: boolean;

  @ApiPropertyOptional({ description: 'Seller response comment' })
  seller_response: string | null;

  @ApiPropertyOptional({ description: 'Timestamp of seller response' })
  seller_response_at: Date | null;

  @ApiProperty({ description: 'Rating status' })
  status: string;

  // ==================== Audit Fields ====================

  @ApiPropertyOptional({ description: 'User who created this record' })
  created_by: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'User who last updated this record' })
  updated_by: number | null;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'User who deleted this record' })
  deleted_by: number | null;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  deleted_at: Date | null;
}
