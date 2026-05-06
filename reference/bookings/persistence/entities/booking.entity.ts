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
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';
import { BookingAddonEntity } from '@/booking-addons/persistence/entities/booking-addon.entity';
import { BookingOptionEntity } from '@/booking-options/persistence/entities/booking-option.entity';
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { BookingGuestEntity } from '@/booking-guests/persistence/entities/booking-guest.entity';
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';

/**
 * Booking TypeORM entity.
 *
 * Represents the bookings table. A service booking created from a sales order.
 * Tracks booking status, scheduling, location, pricing, and completion.
 *
 * Note: checkout_order_id is deprecated. New bookings use sales_order_item_id.
 *
 * @version 2
 * @since 1.0.0
 */
@Entity({
  name: 'bookings',
})
@Index('IDX_bookings_checkout_order_id', ['checkout_order_id'])
@Index('IDX_bookings_sales_order_id', ['sales_order_id'])
@Index('IDX_bookings_sales_order_item_id', ['sales_order_item_id'])
@Index('IDX_bookings_seller_id', ['seller_id'])
@Index('IDX_bookings_service_id', ['service_id'])
@Index('IDX_bookings_customer_id', ['customer_id'])
@Index('IDX_bookings_assigned_member_id', ['assigned_member_id'])
@Index('IDX_bookings_booking_number', ['booking_number'], { unique: true })
@Index('IDX_bookings_status', ['status'])
@Index('IDX_bookings_scheduled_date', ['scheduled_date'])
@Index('IDX_bookings_is_assessment', ['is_assessment'])
@Index('IDX_bookings_source_quotation_id', ['source_quotation_id'])
@Index('IDX_bookings_form_submission_id', ['form_submission_id'])
@Index('IDX_bookings_recurrence_group_id', ['recurrence_group_id'])
@Index('IDX_bookings_deleted_at', ['deleted_at'])
@Index('IDX_bookings_guest_email', ['guest_email'])
@Index('IDX_bookings_booking_group_number', ['booking_group_number'])
@Index('IDX_bookings_guest_payment_method', ['guest_payment_method'])
@Index('IDX_bookings_guest_count', ['guest_count'])
@Index('IDX_bookings_open_play_event_id', ['open_play_event_id'])
export class BookingEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  // DEPRECATED: Use sales_order_item_id instead. Kept for backward compatibility.
  @Column({ type: 'int', nullable: true })
  checkout_order_id: number | null;

  @ManyToOne(() => CheckoutOrderEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'checkout_order_id' })
  checkout_order: CheckoutOrderEntity | null;

  // NEW: Link to sales order (for quick lookups)
  @Column({ type: 'int', nullable: true })
  sales_order_id: number | null;

  @ManyToOne(() => SalesOrderEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity | null;

  // NEW: Link to sales order item (source of truth for add-ons/options)
  @Column({ type: 'int', nullable: true })
  sales_order_item_id: number | null;

  @ManyToOne(() => SalesOrderItemEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item: SalesOrderItemEntity | null;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'int', nullable: true })
  package_id: number | null;

  @ManyToOne(() => ServicePackageEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'package_id' })
  package: ServicePackageEntity | null;

  @Column({ type: 'int', nullable: true })
  bundle_id: number | null;

  // ==================== DPO Assessment Fields ====================

  /**
   * Indicates if this is an assessment booking (DPO flow).
   * Assessment bookings have checklist milestones and generate quotations.
   *
   * @deprecated Use `service.requires_quote` to determine flow type instead.
   * This field is kept for backward compatibility with existing data.
   * New bookings should check the linked service's `requires_quote` flag.
   */
  @Column({ type: 'boolean', default: false, nullable: false })
  is_assessment: boolean;

  /**
   * The quotation generated FROM this assessment booking.
   * Only set for assessment bookings after provider creates the quotation.
   */
  @Column({ type: 'int', nullable: true })
  quotation_id: number | null;

  @ManyToOne(() => QuoteRequestEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'quotation_id' })
  quotation: QuoteRequestEntity | null;

  /**
   * The quotation this booking was created FROM.
   * Set when customer accepts a quotation and service bookings are created.
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_id: number | null;

  @ManyToOne(() => QuoteRequestEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'source_quotation_id' })
  source_quotation: QuoteRequestEntity | null;

  /**
   * The specific quotation line item this booking was created from.
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_item_id: number | null;

  // ==================== End DPO Assessment Fields ====================

  // ==================== MEPF Flow Fields ====================

  /**
   * FK to form_submissions table.
   * Links this booking to the customer's form submission data.
   */
  @Column({ type: 'int', nullable: true })
  form_submission_id: number | null;

  /**
   * UUID to group recurring bookings together.
   * All bookings in a recurrence series share the same group ID.
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  recurrence_group_id: string | null;

  /**
   * Index in the recurrence series (1, 2, 3... for monthly bookings).
   * Null for non-recurring bookings.
   */
  @Column({ type: 'int', nullable: true })
  recurrence_index: number | null;

  // ==================== End MEPF Flow Fields ====================

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  booking_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  booking_group_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guest_email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  guest_payment_method: string | null;

  @Column({ type: 'smallint', nullable: false, default: 1 })
  guest_count: number;

  @Column({ type: 'int', nullable: true })
  open_play_event_id: number | null;

  @Column({ type: 'int', nullable: true })
  assigned_member_id: number | null;

  @ManyToOne(() => SellerMemberEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'assigned_member_id' })
  assigned_member: SellerMemberEntity | null;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  // Schedule
  @Column({ type: 'date', nullable: false })
  scheduled_date: Date;

  @Column({ type: 'time', nullable: false })
  scheduled_start_time: string;

  @Column({ type: 'time', nullable: true })
  scheduled_end_time: string | null;

  @Column({ type: 'timestamp', nullable: true })
  actual_start_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actual_end_time: Date | null;

  // Location
  @Column({ type: 'int', nullable: true })
  service_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'service_address_id' })
  service_address: UserAddressEntity | null;

  @Column({ type: 'text', nullable: true })
  service_address_text: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  service_latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  service_longitude: number | null;

  @Column({
    type: 'enum',
    enum: AppointmentLocationTypeEnum,
    default: AppointmentLocationTypeEnum.HOME_SERVICE,
    nullable: false,
  })
  appointment_location_type: AppointmentLocationTypeEnum;

  // Pricing breakdown
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  base_price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  addons_total: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  options_total: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  location_additional_fee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  discount_amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  platform_fee: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10.0,
    nullable: false,
  })
  platform_fee_percent: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  provider_payout: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  total: number;

  // Status
  @Column({
    type: 'enum',
    enum: BookingStatusEnum,
    default: BookingStatusEnum.PENDING,
    nullable: false,
  })
  status: BookingStatusEnum;

  // Notes
  @Column({ type: 'text', nullable: true })
  customer_notes: string | null;

  @Column({ type: 'text', nullable: true })
  provider_notes: string | null;

  @Column({ type: 'text', nullable: true })
  internal_notes: string | null;

  // Cancellation
  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'int', nullable: true })
  cancelled_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'cancelled_by' })
  cancelled_by_user: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  // Completion
  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  // Notification tracking
  @Column({ type: 'timestamp', nullable: true })
  starting_soon_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  reminder_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pending_confirmation_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  review_reminder_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date | null;

  // Customer approval (after service completion)
  @Column({ type: 'boolean', default: false, nullable: true })
  customer_approved: boolean | null;

  @Column({ type: 'timestamp', nullable: true })
  customer_approved_at: Date | null;

  @Column({ type: 'text', nullable: true })
  customer_feedback: string | null;

  @Column({ type: 'smallint', nullable: true })
  customer_rating: number | null;

  // Reschedule request
  @Column({ type: 'text', nullable: true })
  reschedule_reason: string | null;

  @Column({ type: 'text', nullable: true })
  reschedule_suggested_times: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reschedule_requested_at: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  reschedule_requested_by: string | null;

  // Relations for booking addons and options (price breakdown details)
  @OneToMany(() => BookingAddonEntity, (addon) => addon.booking, {
    eager: false,
    cascade: false,
  })
  booking_addons?: BookingAddonEntity[];

  @OneToMany(() => BookingOptionEntity, (option) => option.booking, {
    eager: false,
    cascade: false,
  })
  booking_options?: BookingOptionEntity[];

  @OneToMany(() => BookingMilestoneEntity, (milestone) => milestone.booking, {
    eager: false,
    cascade: false,
  })
  booking_milestones?: BookingMilestoneEntity[];

  @OneToMany(() => BookingGuestEntity, (guest) => guest.booking, {
    eager: false,
    cascade: false,
  })
  booking_guests?: BookingGuestEntity[];

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
