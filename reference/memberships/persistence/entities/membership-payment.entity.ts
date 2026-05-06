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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipPlanBillingPeriodEntity } from './membership-plan-billing-period.entity';

/**
 * Membership payment persistence entity.
 */
@Entity({ name: 'membership_payments' })
@Index(['membership_id'])
@Index(['user_id'])
@Index(['membership_plan_billing_period_id'])
@Index(['payment_status'])
@Index(['paid_at'])
export class MembershipPaymentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int' })
  membership_id: number;
  @ManyToOne(() => MembershipEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'membership_id' })
  membership: MembershipEntity;
  @Column({ type: 'int' })
  user_id: number;
  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @Column({ type: 'int' })
  membership_plan_billing_period_id: number;
  @ManyToOne(() => MembershipPlanBillingPeriodEntity, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'membership_plan_billing_period_id' })
  membership_plan_billing_period: MembershipPlanBillingPeriodEntity;

  // Snapshot fields — immutable record of what was charged
  @Column({ type: 'int' })
  membership_plan_id: number;
  @Column({ type: 'varchar', length: 100 })
  membership_plan_code: string;
  @Column({ type: 'varchar', length: 255 })
  membership_plan_name: string;
  @Column({ type: 'varchar', length: 50 })
  billing_period_code: string;
  @Column({ type: 'int' })
  billing_duration_months: number;
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  base_monthly_price: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;
  @Column({ type: 'varchar', length: 10, default: 'PHP' })
  currency: string;

  @Column({ type: 'enum', enum: MembershipPaymentStatusEnum })
  payment_status: MembershipPaymentStatusEnum;
  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_reference: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_reference_number: string | null;
  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;
  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_method_code: string | null;
  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;
  @Column({ type: 'varchar', length: 1000, nullable: true })
  payment_proof_url: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true })
  payment_proof_key: string | null;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;
  @CreateDateColumn()
  created_at: Date;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;
  @UpdateDateColumn()
  updated_at: Date;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;
  @DeleteDateColumn()
  deleted_at: Date | null;
}
