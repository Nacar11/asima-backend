import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';

export class InitiateSubscriptionPaymentResponseDto {
  @ApiProperty({ type: Number })
  subscription_payment_id: number;

  @ApiProperty({ type: String })
  transaction_number: string;

  @ApiProperty({ type: String })
  gateway_reference_number: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  checkout_url: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  qr_image_url: string | null;

  @ApiProperty({ type: Boolean, default: false })
  requires_manual_confirmation: boolean;

  @ApiProperty({ enum: SubscriptionPaymentStatusEnum })
  payment_status: SubscriptionPaymentStatusEnum;
}
