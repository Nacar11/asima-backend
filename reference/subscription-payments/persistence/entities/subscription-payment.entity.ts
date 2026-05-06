import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';

@Entity({ name: 'subscription_payments' })
export class SubscriptionPaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SubscriptionEntity, { eager: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;

  @Column({ name: 'subscription_id', type: 'int' })
  subscription_id: number;

  @Column({ name: 'payment_number', type: 'varchar', length: 50, unique: true })
  payment_number: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: SubscriptionPaymentStatusEnum,
    default: SubscriptionPaymentStatusEnum.PENDING,
  })
  payment_status: SubscriptionPaymentStatusEnum;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  transaction_id: string | null;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  payment_method: string | null;

  @Column({
    name: 'payment_reference_number',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  payment_reference_number: string | null;

  @Column({
    name: 'payment_proof_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  payment_proof_url: string | null;

  @Column({
    name: 'payment_proof_key',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  payment_proof_key: string | null;

  @Column({ name: 'billing_cycle_start', type: 'date' })
  billing_cycle_start: Date;

  @Column({ name: 'billing_cycle_end', type: 'date' })
  billing_cycle_end: Date;

  @Column({ name: 'due_date', type: 'date' })
  due_date: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewed_by: number | null;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  failure_reason: string | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retry_count: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  next_retry_at: Date | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
