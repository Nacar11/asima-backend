import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';

export class PickleballMerchantApplicationListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  application_number: string;

  @ApiProperty()
  merchant_name: string;

  @ApiPropertyOptional({ nullable: true })
  location_name?: string | null;

  @ApiProperty()
  owner_email: string;

  @ApiProperty()
  approver_email: string;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  province?: string | null;

  @ApiProperty({ enum: PickleballMerchantApplicationStatusEnum })
  status: PickleballMerchantApplicationStatusEnum;

  @ApiProperty({ enum: PickleballMerchantOwnerSetupStatusEnum })
  owner_setup_status: PickleballMerchantOwnerSetupStatusEnum;

  @ApiProperty({
    enum: PickleballMerchantSubscriptionPaymentStatusEnum,
  })
  subscription_payment_status: PickleballMerchantSubscriptionPaymentStatusEnum;

  @ApiProperty({ enum: PickleballMerchantOnboardingStatusEnum })
  onboarding_status: PickleballMerchantOnboardingStatusEnum;

  @ApiProperty({ enum: PickleballMerchantListingStatusEnum })
  listing_status: PickleballMerchantListingStatusEnum;

  @ApiPropertyOptional({ nullable: true })
  seller_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  subscription_status?: string | null;

  @ApiProperty()
  courts_count: number;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ nullable: true })
  reviewed_at?: Date | null;
}
