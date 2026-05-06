import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuestBookingGuestDto } from './guest-booking-guest.dto';

export class SellerAwaitingConfirmationBookingDto {
  @ApiProperty({ type: Number, example: 101 })
  booking_id: number;

  @ApiProperty({ type: String, example: 'BK-20260311-1001' })
  booking_number: string;

  @ApiProperty({ type: String, example: 'guest@example.com' })
  guest_email: string;

  @ApiProperty({ type: String, example: 'Guest User' })
  guest_name: string;

  @ApiProperty({ type: Number, example: 4 })
  guest_count: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Guest One, Guest Two, Guest Three',
    nullable: true,
  })
  guest_names_summary: string | null;

  @ApiPropertyOptional({
    type: [GuestBookingGuestDto],
    nullable: true,
  })
  guests?: GuestBookingGuestDto[] | null;

  @ApiProperty({ type: String, example: 'Court A' })
  service_title: string;

  @ApiProperty({ type: String, example: '2026-03-11' })
  scheduled_date: string;

  @ApiProperty({ type: String, example: '10:00:00' })
  scheduled_start_time: string;

  @ApiPropertyOptional({ type: String, example: '11:00:00', nullable: true })
  scheduled_end_time: string | null;

  @ApiProperty({ type: Number, example: 1000 })
  amount: number;

  @ApiProperty({ type: String, example: 'PHP' })
  currency: string;

  @ApiProperty({ type: String, example: 'awaiting_confirmation' })
  booking_status: string;

  @ApiProperty({ type: String, example: 'processing' })
  payment_status: string;

  @ApiPropertyOptional({
    type: String,
    example: 'PAY-GUEST-ABC123',
    nullable: true,
  })
  payment_reference: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-11T10:05:30.000Z',
    nullable: true,
  })
  payment_notified_at: string | null;

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
}
