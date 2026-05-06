import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MembershipPaymentStatusResponseDto {
  @ApiProperty({ type: Number })
  membership_payment_id: number;

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

  @ApiPropertyOptional({ type: String, nullable: true })
  payment_expires_at: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  payment_proof_url: string | null;
}
