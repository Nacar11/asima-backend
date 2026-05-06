import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';

export class MembershipPayment {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_id: number;
  @ApiProperty({ type: Number, example: 15 })
  user_id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_billing_period_id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_id: number;
  @ApiProperty({ type: String, example: 'starter' })
  membership_plan_code: string;
  @ApiProperty({ type: String, example: 'Starter Plan' })
  membership_plan_name: string;
  @ApiProperty({ type: String, example: 'monthly' })
  billing_period_code: string;
  @ApiProperty({ type: Number, example: 1 })
  billing_duration_months: number;
  @ApiProperty({ type: Number, example: 1499 })
  base_monthly_price: number;
  @ApiProperty({ type: Number, example: 0 })
  discount_percentage: number;
  @ApiProperty({ type: Number, example: 1499 })
  amount: number;
  @ApiProperty({ type: String, example: 'PHP' })
  currency: string;
  @ApiProperty({
    enum: MembershipPaymentStatusEnum,
    example: MembershipPaymentStatusEnum.PAID,
  })
  payment_status: MembershipPaymentStatusEnum;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'dragonpay' })
  provider?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'DP-20260225-0001',
  })
  provider_reference?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'DP-REF-0001',
  })
  gateway_reference_number?: string | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  paid_at?: Date | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  payment_method_code?: string | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  expires_at?: Date | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  payment_proof_url?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  payment_proof_key?: string | null;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  created_by?: Causer | null;
  @ApiProperty()
  created_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  updated_by?: Causer | null;
  @ApiProperty()
  updated_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;
  @Exclude()
  __entity?: string;
}
