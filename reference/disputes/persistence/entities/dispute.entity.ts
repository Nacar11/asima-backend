import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { DisputeStatusEnum } from '../../enums/dispute-status.enum';
import { DisputeReasonEnum } from '../../enums/dispute-reason.enum';
import { DisputeResolutionEnum } from '../../enums/dispute-resolution.enum';

/**
 * Dispute TypeORM entity.
 *
 * Represents the disputes table. Tracks customer-initiated disputes
 * on completed bookings, including evidence, provider responses,
 * and admin resolutions.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'disputes',
})
@Index('IDX_disputes_booking_id', ['booking_id'])
@Index('IDX_disputes_customer_id', ['customer_id'])
@Index('IDX_disputes_seller_id', ['seller_id'])
@Index('IDX_disputes_status', ['status'])
@Index('IDX_disputes_deleted_at', ['deleted_at'])
export class DisputeEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  booking_id: number;

  @ManyToOne(() => BookingEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  dispute_number: string | null;

  @Column({
    type: 'enum',
    enum: DisputeStatusEnum,
    default: DisputeStatusEnum.OPEN,
    nullable: false,
  })
  status: DisputeStatusEnum;

  @Column({
    type: 'enum',
    enum: DisputeReasonEnum,
    nullable: false,
  })
  reason: DisputeReasonEnum;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'text', array: true, nullable: true })
  evidence_urls: string[] | null;

  @Column({
    type: 'enum',
    enum: DisputeResolutionEnum,
    nullable: true,
  })
  requested_resolution: DisputeResolutionEnum | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  requested_refund_amount: number | null;

  // --- Resolution fields (filled by admin) ---

  @Column({
    type: 'enum',
    enum: DisputeResolutionEnum,
    nullable: true,
  })
  resolution: DisputeResolutionEnum | null;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string | null;

  @Column({ type: 'int', nullable: true })
  resolved_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'resolved_by' })
  resolved_by_user: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refund_amount: number;

  // --- Provider response fields ---

  @Column({ type: 'text', nullable: true })
  provider_response: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  provider_evidence_urls: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  provider_responded_at: Date | null;

  // --- Customer reply fields (reply to provider response) ---

  @Column({ type: 'text', nullable: true })
  customer_reply: string | null;

  @Column({ type: 'timestamp', nullable: true })
  customer_replied_at: Date | null;

  // --- Audit ---

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

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
