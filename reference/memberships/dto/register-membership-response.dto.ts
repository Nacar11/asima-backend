import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';

export class RegisterMembershipResponseDto {
  @ApiProperty({ type: Number, example: 10 })
  membership_id: number;
  @ApiProperty({ type: Number, example: 25 })
  membership_payment_id: number;
  @ApiProperty({ type: Number, example: 149 })
  amount: number;
  @ApiProperty({ type: String, example: 'PHP' })
  currency: string;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_billing_period_id: number;
  @ApiProperty({ type: String, example: 'monthly' })
  billing_period_code: string;
  @ApiProperty({ enum: MembershipPaymentStatusEnum })
  payment_status: MembershipPaymentStatusEnum;
  @ApiProperty({ type: String, example: 'TXN-LT77JFD-X3L8OP' })
  transaction_number: string;
  @ApiProperty({
    type: String,
    example: 'https://mock-payment.localhost/membership/success',
    nullable: true,
  })
  checkout_url: string | null;
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'True when returning existing pending membership instead of creating new',
  })
  already_pending?: boolean;
}
