import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';
import { PickleballMerchantApplicationCourtEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application-court.entity';

@Entity({ name: 'pickleball_merchant_applications' })
@Index(['application_number'], { unique: true })
@Index(['status'])
@Index(['created_at'])
@Index(['owner_email'])
@Index(['approver_email'])
export class PickleballMerchantApplicationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  application_number: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  merchant_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location_name: string | null;

  @Column({ type: 'text', nullable: true })
  merchant_description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  approver_email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barangay: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  gcash_qr_image_url: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: false,
    default: PickleballMerchantApplicationStatusEnum.SUBMITTED,
  })
  status: PickleballMerchantApplicationStatusEnum;

  @Column({ type: 'text', nullable: true })
  review_notes: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: false,
    default: PickleballMerchantOwnerSetupStatusEnum.NOT_STARTED,
  })
  owner_setup_status: PickleballMerchantOwnerSetupStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  owner_setup_completed_at: Date | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewed_by: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  owner_user: UserEntity | null;

  @Column({ type: 'int', nullable: true, unique: true })
  owner_user_id: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'approver_user_id' })
  approver_user: UserEntity | null;

  @Column({ type: 'int', nullable: true, unique: true })
  approver_user_id: number | null;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

  @Column({ type: 'int', nullable: true, unique: true })
  seller_id: number | null;

  @ManyToOne(() => SubscriptionEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity | null;

  @Column({ type: 'int', nullable: true, unique: true })
  subscription_id: number | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: false,
    default: PickleballMerchantSubscriptionPaymentStatusEnum.NOT_STARTED,
  })
  subscription_payment_status: PickleballMerchantSubscriptionPaymentStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  subscription_payment_submitted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  subscription_payment_reviewed_at: Date | null;

  @Column({ type: 'int', nullable: true })
  subscription_payment_reviewed_by: number | null;

  @Column({ type: 'text', nullable: true })
  subscription_payment_rejection_reason: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: false,
    default: PickleballMerchantOnboardingStatusEnum.NOT_STARTED,
  })
  onboarding_status: PickleballMerchantOnboardingStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  onboarding_started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  onboarding_completed_at: Date | null;

  @Column({ type: 'int', nullable: true })
  onboarding_completed_by: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: PickleballMerchantListingStatusEnum.HIDDEN,
  })
  listing_status: PickleballMerchantListingStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  listing_published_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @OneToMany(
    () => PickleballMerchantApplicationCourtEntity,
    (court) => court.application,
    { eager: false },
  )
  courts?: PickleballMerchantApplicationCourtEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
