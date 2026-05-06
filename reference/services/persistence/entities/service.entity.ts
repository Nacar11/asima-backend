import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'services' })
@Index(['code'], { unique: true })
@Index(['seller_id'])
@Index(['category_id'])
@Index(['status'])
export class ServiceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: true })
  category_id: number | null;

  @ManyToOne(() => ServiceCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: ServiceCategoryEntity | null;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency?: CurrencyEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  short_description: string | null;

  @Column({
    type: 'enum',
    enum: PricingTypeEnum,
    default: PricingTypeEnum.FIXED,
    nullable: false,
  })
  pricing_type: PricingTypeEnum;

  /**
   * Service type: standard (preventive), assessment (DPO), or general (simple book-and-deliver).
   */
  @Column({
    type: 'enum',
    enum: ServiceTypeEnum,
    default: ServiceTypeEnum.STANDARD,
    nullable: false,
  })
  service_type: ServiceTypeEnum;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  base_price: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate: number | null;

  @Column({ type: 'int', nullable: true })
  estimated_duration_minutes: number | null;

  @Column({ type: 'int', nullable: true })
  minimum_duration_minutes: number | null;

  @Column({ type: 'int', nullable: true })
  maximum_duration_minutes: number | null;

  @Column({ type: 'int', nullable: true, default: 10 })
  service_radius_km: number | null;

  /**
   * @deprecated Use service_location_type instead.
   * Kept for backward compatibility during migration.
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  is_remote_available: boolean;

  @Column({
    type: 'enum',
    enum: ServiceLocationTypeEnum,
    default: ServiceLocationTypeEnum.HOME_SERVICE,
    nullable: false,
  })
  service_location_type: ServiceLocationTypeEnum;

  // ==================== Venue Configuration ====================

  /** Number of bookable units (e.g., 5 courts). Only for service_type = 'venue'. */
  @Column({ type: 'int', nullable: true, default: null })
  venue_capacity: number | null;

  /** Duration of each time slot in minutes (e.g., 60). Only for service_type = 'venue'. */
  @Column({ type: 'int', nullable: true, default: null })
  slot_duration_minutes: number | null;

  // ==================== Peak Pricing Configuration ====================

  /** Multiplier for peak pricing (e.g., 1.5 = 50% surcharge). Null = no peak pricing. */
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    default: null,
  })
  peak_price_multiplier: number | null;

  /** Days of week that are peak (0=Sun, 6=Sat). e.g., [0, 5, 6]. Null = no peak days. */
  @Column({ type: 'simple-array', nullable: true, default: null })
  peak_days: number[] | null;

  /** Optional: start of peak hours within peak days. If null, entire peak day is peak. */
  @Column({ type: 'time', nullable: true, default: null })
  peak_start_time: string | null;

  /** Optional: end of peak hours within peak days. */
  @Column({ type: 'time', nullable: true, default: null })
  peak_end_time: string | null;

  // ==================== Booking Limits ====================

  @Column({ type: 'int', nullable: true })
  max_bookings_per_day: number | null;

  @Column({ type: 'int', nullable: true, default: 30 })
  advance_booking_days: number | null;

  @Column({ type: 'int', nullable: true, default: 24 })
  minimum_notice_hours: number | null;

  @Column({
    type: 'enum',
    enum: ServiceStatusEnum,
    default: ServiceStatusEnum.DRAFT,
    nullable: false,
  })
  status: ServiceStatusEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_featured: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  requires_quote: boolean;

  /**
   * Indicates if this service has checklist templates (for assessment/reactive services).
   * Services with checklists are filled by providers during service delivery.
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  has_checklist: boolean;

  @Column({ type: 'boolean', default: true, nullable: false })
  instant_booking: boolean;

  @Column({ type: 'int', default: 0, nullable: false })
  view_count: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_bookings: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    nullable: false,
  })
  average_rating: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_reviews: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  // Relations
  @OneToMany(
    () => ServiceMilestoneTemplateEntity,
    (template) => template.service,
  )
  milestone_templates?: ServiceMilestoneTemplateEntity[];

  @OneToMany(() => ServiceOptionGroupEntity, (group) => group.service)
  option_groups?: ServiceOptionGroupEntity[];

  @OneToMany(() => ServiceAddonEntity, (addon) => addon.service)
  addons?: ServiceAddonEntity[];

  @OneToMany(() => ServiceGalleryEntity, (gallery) => gallery.service)
  gallery?: ServiceGalleryEntity[];
}
