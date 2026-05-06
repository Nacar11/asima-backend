import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Individual item in the checkout preview.
 */
export class QuotationCheckoutPreviewItem {
  @ApiProperty({ example: 1 })
  quotation_item_id: number;

  @ApiProperty({ example: 'service', enum: ['service', 'material'] })
  item_type: string;

  @ApiPropertyOptional({ example: 1 })
  service_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  product_id?: number | null;

  @ApiProperty({ example: 'Compressor Replacement' })
  name: string;

  @ApiPropertyOptional({ example: 'Replace faulty compressor' })
  description?: string | null;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 5000.0 })
  unit_price: number;

  @ApiProperty({ example: 5000.0 })
  total_price: number;

  @ApiPropertyOptional({ example: '2026-02-15' })
  suggested_schedule_date?: string | null;
}

/**
 * Booking preview for preventive flow.
 */
export class BookingPreview {
  @ApiProperty({ example: 1 })
  booking_id: number;

  @ApiProperty({ example: 'BK-20260124-1234' })
  booking_number: string;

  @ApiProperty({ example: 'awaiting_quotation' })
  current_status: string;

  @ApiProperty({ example: '2026-02-15' })
  scheduled_date: string;

  @ApiPropertyOptional({ example: '09:00:00' })
  scheduled_start_time?: string | null;

  @ApiProperty({ example: 'Will be updated to CONFIRMED after checkout' })
  action_note: string;
}

/**
 * Summary of the checkout.
 */
export class QuotationCheckoutSummary {
  @ApiProperty({ example: 3, description: 'Number of line items' })
  item_count: number;

  @ApiProperty({ example: 2, description: 'Number of service items' })
  service_item_count: number;

  @ApiProperty({ example: 1, description: 'Number of material items' })
  material_item_count: number;

  @ApiProperty({ example: 15000.0, description: 'Services subtotal' })
  services_subtotal: number;

  @ApiProperty({ example: 2000.0, description: 'Materials subtotal' })
  materials_subtotal: number;

  @ApiProperty({ example: 17000.0, description: 'Combined subtotal' })
  subtotal: number;

  @ApiProperty({ example: 1700.0, description: 'Platform fee (10%)' })
  platform_fee: number;

  @ApiProperty({ example: 10.0, description: 'Platform fee percentage' })
  platform_fee_percent: number;

  @ApiProperty({ example: 17000.0, description: 'Total amount to pay' })
  total_amount: number;
}

/**
 * Response DTO for quotation checkout preview.
 */
export class QuotationCheckoutPreviewResponseDto {
  @ApiProperty({ example: true })
  can_checkout: boolean;

  @ApiProperty({ example: 1 })
  quotation_id: number;

  @ApiProperty({ example: 'QR-20260124-1234' })
  quote_number: string;

  @ApiProperty({ example: 'Quoted' })
  quotation_status: string;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z' })
  expires_at?: Date | null;

  @ApiProperty({ example: false })
  is_expired: boolean;

  @ApiProperty({ example: 'preventive', enum: ['preventive', 'reactive'] })
  flow_type: string;

  @ApiProperty({ type: [QuotationCheckoutPreviewItem] })
  items: QuotationCheckoutPreviewItem[];

  @ApiPropertyOptional({
    type: [BookingPreview],
    description: 'Existing bookings to update (preventive flow only)',
  })
  existing_bookings?: BookingPreview[];

  @ApiProperty({ type: QuotationCheckoutSummary })
  summary: QuotationCheckoutSummary;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];
}
