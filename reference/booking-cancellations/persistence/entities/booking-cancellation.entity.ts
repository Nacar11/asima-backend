import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CancellationRoleEnum } from '@/booking-cancellations/enums/cancellation-role.enum';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { CancellationPolicyEnum } from '@/booking-cancellations/enums/cancellation-policy.enum';

/**
 * Booking Cancellation TypeORM entity.
 *
 * Represents a cancelled booking with refund calculations and policy application.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'booking_cancellations' })
@Index('IDX_booking_cancellations_booking_id', ['booking_id'])
@Index('IDX_booking_cancellations_cancelled_by', ['cancelled_by'])
@Index('IDX_booking_cancellations_cancelled_by_role', ['cancelled_by_role'])
@Index('IDX_booking_cancellations_policy_applied', ['policy_applied'])
@Index('IDX_booking_cancellations_created_at', ['created_at'])
export class BookingCancellationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, unique: true })
  booking_id: number;

  @OneToOne(() => BookingEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: false })
  cancelled_by: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'cancelled_by' })
  cancelled_by_user: UserEntity;

  @Column({
    type: 'enum',
    enum: CancellationRoleEnum,
    nullable: false,
  })
  cancelled_by_role: CancellationRoleEnum;

  @Column({
    type: 'enum',
    enum: CancellationReasonEnum,
    nullable: false,
  })
  reason: CancellationReasonEnum;

  @Column({ type: 'text', nullable: true })
  reason_details: string | null;

  @Column({ type: 'date', nullable: false })
  scheduled_date: Date;

  @Column({ type: 'time', nullable: false })
  scheduled_time: string;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'now()' })
  cancelled_at: Date;

  @Column({ type: 'int', nullable: true })
  hours_before_scheduled: number | null;

  @Column({
    type: 'enum',
    enum: CancellationPolicyEnum,
    nullable: false,
  })
  policy_applied: CancellationPolicyEnum;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  cancellation_fee_percent: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cancellation_fee_amount: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  original_amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  refund_amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  store_compensation: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  platform_fee_refunded: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  escrow_refunded: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  escrow_released_to_store: number;

  @Column({ type: 'int', nullable: true })
  refund_id: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  internal_notes: string | null;

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
  deleted_at: Date | null;
}
