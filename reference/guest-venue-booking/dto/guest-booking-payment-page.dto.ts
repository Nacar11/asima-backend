import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuestBookingGuestDto } from './guest-booking-guest.dto';

export class GuestBookingPaymentSlotDto {
  @ApiProperty({ type: String, example: 'BK-20260311-1001' })
  booking_number: string;

  @ApiPropertyOptional({ type: Number, example: 42, nullable: true })
  service_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Court 1',
    nullable: true,
  })
  venue_name?: string | null;

  @ApiProperty({ type: String, example: '2026-03-11' })
  scheduled_date: string;

  @ApiProperty({ type: String, example: '10:00:00' })
  scheduled_start_time: string;

  @ApiPropertyOptional({ type: String, example: '11:00:00', nullable: true })
  scheduled_end_time: string | null;

  @ApiPropertyOptional({ type: Number, example: 2, nullable: true })
  slot_count?: number | null;
}

export class GuestBookingPaymentPageDto {
  @ApiProperty({ type: String, example: 'BK-20260311-1001' })
  booking_number: string;

  @ApiPropertyOptional({
    type: String,
    example: 'BKG-20260311-1001',
    nullable: true,
  })
  booking_group_number?: string | null;

  @ApiProperty({
    type: [String],
    example: ['BK-20260311-1001', 'BK-20260311-1002'],
  })
  booking_numbers: string[];

  @ApiProperty({ type: String, example: 'awaiting_confirmation' })
  booking_status: string;

  @ApiProperty({ type: String, example: 'processing' })
  payment_status: string;

  @ApiProperty({ type: String, example: 'awaiting_confirmation' })
  ui_status: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'True when the total is fully covered by a voucher — no payment action is needed.',
  })
  payment_not_required: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: ['regular', 'open_play'],
    example: 'open_play',
    nullable: true,
  })
  booking_type?: 'regular' | 'open_play' | null;

  @ApiProperty({ type: String, example: 'Venue A Court' })
  service_title: string;

  @ApiProperty({ type: String, example: 'Anjo World Courts' })
  seller_store_name: string;

  @ApiProperty({ type: String, example: '2026-03-11' })
  scheduled_date: string;

  @ApiProperty({ type: String, example: '10:00:00' })
  scheduled_start_time: string;

  @ApiPropertyOptional({ type: String, example: '12:00:00', nullable: true })
  scheduled_end_time: string | null;

  @ApiProperty({ type: Number, example: 2000 })
  amount: number;

  @ApiProperty({ type: String, example: 'PHP' })
  currency: string;

  @ApiProperty({ type: String, example: 'gcash' })
  payment_method: string;

  @ApiPropertyOptional({
    type: String,
    example: 'PAY-MM123ABC',
    nullable: true,
  })
  payment_reference: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-11T09:42:00.000Z',
    nullable: true,
  })
  booked_at: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-11T10:15:00.000Z',
    nullable: true,
  })
  payment_expires_at: string | null;

  @ApiProperty({ type: String, example: 'guest@example.com' })
  guest_email: string;

  @ApiProperty({ type: Number, example: 4 })
  guest_count: number;

  @ApiPropertyOptional({
    type: Number,
    example: 16,
    description:
      'Maximum persons allowed for this booking context. Open Play uses event max_applicants; regular bookings use venue cap.',
    nullable: true,
  })
  max_persons?: number | null;

  @ApiPropertyOptional({
    type: [GuestBookingGuestDto],
    nullable: true,
  })
  guests?: GuestBookingGuestDto[] | null;

  @ApiPropertyOptional({
    type: GuestBookingGuestDto,
    nullable: true,
  })
  primary_guest?: GuestBookingGuestDto | null;

  @ApiPropertyOptional({
    type: String,
    example:
      'https://cdn.example.com/guest-payment-proofs/BK-20260311-1001.png',
    nullable: true,
  })
  payment_proof_url: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-11T10:06:00.000Z',
    nullable: true,
  })
  payment_proof_uploaded_at: string | null;

  @ApiPropertyOptional({
    type: [GuestBookingPaymentSlotDto],
    nullable: true,
  })
  booking_slots?: GuestBookingPaymentSlotDto[] | null;

  /**
   * Admin-configured QR image URL for the selected manual payment method.
   * Null when the method has no QR image configured or is not a manual QR method.
   * Mobile should render this URL and fall back to its bundled asset when null.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'https://cdn.example.com/qr/gcash.png',
    nullable: true,
  })
  qr_image_url?: string | null;

  /**
   * Human-readable label for the selected payment method (e.g. "GCash", "Maya").
   * Derived from the custom_payment_methods name field when available.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'GCash',
    nullable: true,
  })
  payment_method_label?: string | null;
}
