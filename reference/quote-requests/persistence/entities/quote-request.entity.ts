import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { QuoteRequestStatusEnum } from '@/quote-requests/domain/quote-request';
import { QuoteTypeEnum } from '@/quote-requests/enums/quote-type.enum';

/**
 * QuoteRequest TypeORM Entity.
 *
 * Represents the quote_requests table for storing customer quote requests
 * and seller responses for services that require custom pricing.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'quote_requests' })
@Index(['quote_number'], { unique: true })
@Index(['customer_id'])
@Index(['seller_id'])
@Index(['service_id'])
@Index(['status'])
export class QuoteRequestEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  quote_number: string;

  // ==================== Relationships ====================

  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({ name: 'seller_id' })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ name: 'service_id' })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ name: 'package_id', nullable: true })
  package_id: number | null;

  @ManyToOne(() => ServicePackageEntity, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package: ServicePackageEntity | null;

  // ==================== Request Details ====================

  @Column({
    type: 'enum',
    enum: QuoteRequestStatusEnum,
    default: QuoteRequestStatusEnum.PENDING,
  })
  status: QuoteRequestStatusEnum;

  // ==================== DPO Quotation Fields ====================

  /**
   * Type of quote: pre-booking request or post-assessment quotation.
   */
  @Column({
    type: 'enum',
    enum: QuoteTypeEnum,
    default: QuoteTypeEnum.PRE_BOOKING,
    nullable: false,
  })
  quote_type: QuoteTypeEnum;

  /**
   * The assessment booking that generated this quotation.
   * Only set for POST_ASSESSMENT quotes.
   */
  @Column({ name: 'assessment_booking_id', nullable: true })
  assessment_booking_id: number | null;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'assessment_booking_id' })
  assessment_booking: BookingEntity | null;

  /**
   * The sales order created when customer accepts this quotation.
   */
  @Column({ name: 'result_sales_order_id', nullable: true })
  result_sales_order_id: number | null;

  @ManyToOne(() => SalesOrderEntity, { nullable: true })
  @JoinColumn({ name: 'result_sales_order_id' })
  result_sales_order: SalesOrderEntity | null;

  /**
   * Parent quotation for revision tracking.
   * If set, this is a revision of the parent quotation.
   */
  @Column({ name: 'parent_quotation_id', nullable: true })
  parent_quotation_id: number | null;

  @ManyToOne(() => QuoteRequestEntity, { nullable: true })
  @JoinColumn({ name: 'parent_quotation_id' })
  parent_quotation: QuoteRequestEntity | null;

  /**
   * Revision number (0 = original, 1+ = revision).
   */
  @Column({ type: 'int', default: 0, nullable: false })
  revision_number: number;

  // ==================== End DPO Quotation Fields ====================

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  special_requirements: string | null;

  @Column({ type: 'int', nullable: true, default: 1 })
  quantity: number | null;

  @Column({ type: 'date', nullable: true })
  preferred_date: string | null;

  @Column({ type: 'time', nullable: true })
  preferred_time: string | null;

  @Column({ name: 'service_address_id', type: 'int', nullable: true })
  service_address_id: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  service_address_text: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  service_latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  service_longitude: number | null;

  // ==================== Quote Response (from Seller) ====================

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  quoted_price: number | null;

  @Column({ name: 'currency_id', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({ type: 'text', nullable: true })
  seller_response: string | null;

  @Column({ type: 'jsonb', nullable: true })
  quote_breakdown: string | null;

  @Column({ type: 'int', nullable: true })
  estimated_duration_minutes: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  quoted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  quote_expires_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiring_soon_notified: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expired_notified: Date | null;

  // ==================== Customer Response ====================

  @Column({ type: 'text', nullable: true })
  customer_response: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  responded_at: Date | null;

  // ==================== Linked Booking ====================

  @Column({ name: 'booking_id', nullable: true })
  booking_id: number | null;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity | null;

  // ==================== Audit Fields ====================

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by_id' })
  deleted_by: UserEntity | null;

  // ==================== Timestamp Fields ====================

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
