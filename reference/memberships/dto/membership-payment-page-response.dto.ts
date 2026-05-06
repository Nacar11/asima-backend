import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MembershipPaymentPageResponseDto {
  @ApiProperty({ type: Number })
  membership_payment_id: number;

  @ApiProperty({ type: String })
  plan_name: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  payment_method_code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  qr_image_url: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  payment_expires_at: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  payment_proof_url: string | null;

  @ApiProperty({ type: Number })
  billing_duration_months: number;

  /** Computed UI status for the frontend state machine */
  @ApiProperty({
    type: String,
    enum: [
      'pending_payment',
      'awaiting_confirmation',
      'confirmed',
      'cancelled',
    ],
  })
  ui_status: string;
}
