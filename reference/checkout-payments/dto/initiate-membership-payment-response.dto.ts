import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';

export class InitiateMembershipPaymentResponseDto {
  @ApiProperty({ type: Number, example: 123 })
  membership_payment_id: number;

  @ApiProperty({ type: String, example: 'PAY-20260302-1234' })
  transaction_number: string;

  @ApiPropertyOptional({ type: String, example: 'DP-REF-0001', nullable: true })
  gateway_reference_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://gw.dragonpay.ph/Pay.aspx?token=...',
    nullable: true,
  })
  checkout_url?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  qr_image_url?: string | null;
  @ApiPropertyOptional({ type: Boolean })
  requires_manual_confirmation?: boolean;

  @ApiProperty({ enum: MembershipPaymentStatusEnum })
  payment_status: MembershipPaymentStatusEnum;
}
