import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestBookingPaymentStatusDto {
  @ApiProperty({ type: String, example: 'BK-20260311-1001' })
  booking_number: string;

  @ApiPropertyOptional({
    type: String,
    example: 'BKG-20260311-1001',
    nullable: true,
  })
  booking_group_number?: string | null;

  @ApiProperty({ type: String, example: 'awaiting_confirmation' })
  booking_status: string;

  @ApiProperty({ type: String, example: 'processing' })
  payment_status: string;

  @ApiProperty({
    type: String,
    example: 'awaiting_confirmation',
    description:
      'Frontend display state: pending_payment, awaiting_confirmation, confirmed, cancelled',
  })
  ui_status: string;

  @ApiPropertyOptional({
    type: String,
    example: 'PAY-MM123ABC',
    nullable: true,
  })
  payment_reference: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-11T10:15:00.000Z',
    nullable: true,
  })
  payment_expires_at: string | null;

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
    type: Number,
    example: 4,
    nullable: true,
  })
  guest_count?: number | null;
}
