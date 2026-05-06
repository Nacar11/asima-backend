import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { Seller } from '@/sellers/domain/seller';
import { QuoteTypeEnum } from '@/quote-requests/enums/quote-type.enum';

/**
 * Quote Request Status Enum.
 *
 * Tracks the lifecycle of a quote request.
 */
export enum QuoteRequestStatusEnum {
  /** Initial status - customer submitted request */
  PENDING = 'Pending',
  /** Seller is reviewing the request */
  REVIEWING = 'Reviewing',
  /** Seller has submitted a quote */
  QUOTED = 'Quoted',
  /** Customer accepted the quote */
  ACCEPTED = 'Accepted',
  /** Customer rejected the quote */
  REJECTED = 'Rejected',
  /** Customer requested revision - awaiting provider to create new quotation */
  REVISION_REQUESTED = 'Revision Requested',
  /** Quote expired without response */
  EXPIRED = 'Expired',
  /** Request was cancelled */
  CANCELLED = 'Cancelled',
}

/**
 * Quote Request Domain Model.
 *
 * Represents a customer's request for a custom quote on a service
 * that has `requires_quote = true`.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuoteRequest {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'QR-20250101-1234' })
  quote_number: string;

  // ==================== Relationships ====================

  @ApiProperty({ type: Number, example: 1 })
  customer_id: number;

  @ApiPropertyOptional({ type: () => User })
  customer?: User;

  @ApiProperty({ type: Number, example: 1 })
  seller_id: number;

  @ApiPropertyOptional({ type: () => Seller })
  seller?: Seller;

  @ApiProperty({ type: Number, example: 1 })
  service_id: number;

  @ApiPropertyOptional({ type: () => Service })
  service?: Service;

  @ApiPropertyOptional({ type: Number, example: 1 })
  package_id?: number | null;

  @ApiPropertyOptional({ type: () => ServicePackage })
  package?: ServicePackage | null;

  // ==================== Request Details ====================

  @ApiProperty({
    enum: QuoteRequestStatusEnum,
    example: QuoteRequestStatusEnum.PENDING,
  })
  status: QuoteRequestStatusEnum;

  // ==================== DPO Quotation Fields ====================

  @ApiProperty({
    enum: QuoteTypeEnum,
    example: QuoteTypeEnum.PRE_BOOKING,
    description:
      'Type of quote: pre-booking request or post-assessment quotation',
  })
  quote_type: QuoteTypeEnum;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Assessment booking that generated this quotation (POST_ASSESSMENT only)',
  })
  assessment_booking_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Sales order created when customer accepts this quotation',
  })
  result_sales_order_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Parent quotation ID for revision tracking',
  })
  parent_quotation_id?: number | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Revision number (0 = original)',
    default: 0,
  })
  revision_number: number;

  // ==================== End DPO Quotation Fields ====================

  @ApiPropertyOptional({
    type: String,
    example: 'I need aircon cleaning for 3 units in my office...',
  })
  description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Please provide quote for weekend service.',
  })
  special_requirements?: string | null;

  @ApiPropertyOptional({ type: Number, example: 3 })
  quantity?: number | null;

  @ApiPropertyOptional({ type: String, example: '2025-02-15' })
  preferred_date?: string | null;

  @ApiPropertyOptional({ type: String, example: '09:00:00' })
  preferred_time?: string | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  service_address_id?: number | null;

  @ApiPropertyOptional({ type: String })
  service_address_text?: string | null;

  @ApiPropertyOptional({ type: Number, example: 14.5995 })
  service_latitude?: number | null;

  @ApiPropertyOptional({ type: Number, example: 120.9842 })
  service_longitude?: number | null;

  // ==================== Quote Response (from Seller) ====================

  @ApiPropertyOptional({
    type: Number,
    example: 4500.0,
    description: 'Quoted price from seller',
  })
  quoted_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  currency_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Seller response/explanation for the quote',
  })
  seller_response?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Detailed breakdown of the quote (JSON)',
  })
  quote_breakdown?: string | null;

  @ApiPropertyOptional({ type: Number, example: 120 })
  estimated_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Date })
  quoted_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    description: 'Quote expiry date (after which quote is no longer valid)',
  })
  quote_expires_at?: Date | null;

  // ==================== Customer Response ====================

  @ApiPropertyOptional({ type: String })
  customer_response?: string | null;

  @ApiPropertyOptional({ type: Date })
  responded_at?: Date | null;

  // ==================== Linked Booking ====================

  @ApiPropertyOptional({
    type: Number,
    description: 'Booking ID if quote was accepted and converted to booking',
  })
  booking_id?: number | null;

  // ==================== Audit Fields ====================

  @ApiPropertyOptional({ type: () => User })
  created_by?: User | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: () => User })
  updated_by?: User | null;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User })
  deleted_by?: User | null;

  @ApiPropertyOptional({ type: Date })
  deleted_at?: Date | null;
}
