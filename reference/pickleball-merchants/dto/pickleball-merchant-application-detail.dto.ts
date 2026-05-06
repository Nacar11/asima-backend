import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';

class PickleballMerchantApplicationCourtItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  hourly_rate: number;

  @ApiProperty()
  display_order: number;
}

class PickleballMerchantApplicationLatestPaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  payment_number: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: SubscriptionPaymentStatusEnum })
  payment_status: SubscriptionPaymentStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  payment_method?: string | null;

  @ApiPropertyOptional({ nullable: true })
  payment_reference_number?: string | null;

  @ApiPropertyOptional({ nullable: true })
  payment_proof_url?: string | null;

  @ApiPropertyOptional({ nullable: true })
  submitted_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_by?: number | null;

  @ApiPropertyOptional({ nullable: true })
  failure_reason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  paid_at?: Date | null;
}

export class PickleballMerchantApplicationDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  application_number: string;

  @ApiProperty()
  merchant_name: string;

  @ApiPropertyOptional({ nullable: true })
  location_name?: string | null;

  @ApiPropertyOptional({ nullable: true })
  merchant_description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contact_name?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contact_phone?: string | null;

  @ApiProperty()
  owner_email: string;

  @ApiProperty()
  approver_email: string;

  @ApiPropertyOptional({ nullable: true })
  address_line?: string | null;

  @ApiPropertyOptional({ nullable: true })
  province?: string | null;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  barangay?: string | null;

  @ApiPropertyOptional({ nullable: true })
  postal_code?: string | null;

  @ApiPropertyOptional({ nullable: true })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  gcash_qr_image_url?: string | null;

  @ApiProperty({ enum: PickleballMerchantApplicationStatusEnum })
  status: PickleballMerchantApplicationStatusEnum;

  @ApiProperty({ enum: PickleballMerchantOwnerSetupStatusEnum })
  owner_setup_status: PickleballMerchantOwnerSetupStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  owner_setup_completed_at?: Date | null;

  @ApiProperty({
    enum: PickleballMerchantSubscriptionPaymentStatusEnum,
  })
  subscription_payment_status: PickleballMerchantSubscriptionPaymentStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  subscription_payment_submitted_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_payment_reviewed_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_payment_reviewed_by?: number | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_payment_rejection_reason?: string | null;

  @ApiProperty({ enum: PickleballMerchantOnboardingStatusEnum })
  onboarding_status: PickleballMerchantOnboardingStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  onboarding_started_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  onboarding_completed_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  onboarding_completed_by?: number | null;

  @ApiProperty({ enum: PickleballMerchantListingStatusEnum })
  listing_status: PickleballMerchantListingStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  listing_published_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completed_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  review_notes?: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejection_reason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewed_by_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  owner_user_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  approver_user_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  seller_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_status?: string | null;

  @ApiPropertyOptional({
    type: () => PickleballMerchantApplicationLatestPaymentDto,
    nullable: true,
  })
  latest_payment?: PickleballMerchantApplicationLatestPaymentDto | null;

  @ApiProperty({ type: () => [PickleballMerchantApplicationCourtItemDto] })
  courts: PickleballMerchantApplicationCourtItemDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
