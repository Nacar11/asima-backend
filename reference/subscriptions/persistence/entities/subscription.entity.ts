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
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => SubscriptionPlanEntity, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlanEntity;

  @Column({ name: 'plan_id' })
  plan_id: number;

  @Column({ name: 'subscription_number', length: 50, unique: true })
  subscription_number: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.PENDING_PAYMENT,
  })
  status: SubscriptionStatusEnum;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ name: 'next_billing_date', type: 'date', nullable: true })
  next_billing_date: Date | null;

  @Column({ name: 'auto_renew', default: true })
  auto_renew: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelled_by: UserEntity | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ name: 'grace_period_start', type: 'timestamp', nullable: true })
  grace_period_start: Date | null;

  @Column({ name: 'grace_period_end', type: 'timestamp', nullable: true })
  grace_period_end: Date | null;

  @Column({ name: 'grace_period_days', type: 'int', nullable: true })
  grace_period_days: number | null;

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
