import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { Subscription } from '@/subscriptions/domain/subscription';

export class SubscriptionPayment {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  subscription_id: number;

  @ApiPropertyOptional({ type: () => Subscription })
  subscription?: Subscription;

  @ApiProperty({ type: String, example: 'SUBPAY-20251212-1234' })
  payment_number: string;

  @ApiProperty({ type: Number, example: 499.0 })
  amount: number;

  @ApiProperty({
    enum: SubscriptionPaymentStatusEnum,
    example: SubscriptionPaymentStatusEnum.PENDING,
  })
  payment_status: SubscriptionPaymentStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'pi_1234567890',
    nullable: true,
  })
  transaction_id?: string | null;

  @ApiPropertyOptional({ type: String, example: 'gcash', nullable: true })
  payment_method?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'REF-20260423-001',
    nullable: true,
  })
  payment_reference_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://cdn.example.com/subscription-payment-proofs/proof.jpg',
    nullable: true,
  })
  payment_proof_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'subscription-payment-proofs/proof.jpg',
    nullable: true,
  })
  payment_proof_key?: string | null;

  @ApiProperty({ type: Date, example: '2025-12-12' })
  billing_cycle_start: Date;

  @ApiProperty({ type: Date, example: '2026-01-12' })
  billing_cycle_end: Date;

  @ApiProperty({ type: Date, example: '2025-12-19' })
  due_date: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  paid_at?: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  submitted_at?: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  reviewed_at?: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  reviewed_by?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Card Declined',
    nullable: true,
  })
  failure_reason?: string | null;

  @ApiProperty({ type: Number, example: 0 })
  retry_count: number;

  @ApiPropertyOptional({ type: Date, nullable: true })
  next_retry_at?: Date | null;

  @ApiPropertyOptional({ type: () => Object })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => Object })
  updated_by?: Causer | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;

  @ApiPropertyOptional({ nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
