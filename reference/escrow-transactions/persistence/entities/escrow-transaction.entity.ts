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
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EscrowTransactionTypeEnum } from '../../enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from '../../enums/escrow-transaction-status.enum';

/**
 * Escrow Transaction TypeORM entity.
 *
 * Represents the escrow_transactions table. Tracks all money movements
 * in/out of escrow for bookings, including deposits, releases, refunds,
 * and dispute holds.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'escrow_transactions',
})
@Index('IDX_escrow_transactions_booking_id', ['booking_id'])
@Index('IDX_escrow_transactions_milestone_id', ['milestone_id'])
@Index('IDX_escrow_transactions_transaction_type', ['transaction_type'])
@Index('IDX_escrow_transactions_status', ['status'])
@Index('IDX_escrow_transactions_deleted_at', ['deleted_at'])
export class EscrowTransactionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  booking_id: number;

  @ManyToOne(() => BookingEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: true })
  milestone_id: number | null;

  @ManyToOne(() => BookingMilestoneEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'milestone_id' })
  milestone: BookingMilestoneEntity | null;

  @Column({
    type: 'enum',
    enum: EscrowTransactionTypeEnum,
    nullable: false,
  })
  transaction_type: EscrowTransactionTypeEnum;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({ type: 'int', nullable: true })
  released_to: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'released_to' })
  released_to_user: UserEntity | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  release_method: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: EscrowTransactionStatusEnum.PENDING,
    nullable: false,
  })
  status: EscrowTransactionStatusEnum;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_number: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  processed_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'processed_by' })
  processed_by_user: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;

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
