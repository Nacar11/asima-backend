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
import { MembershipPlanEntity } from './membership-plan.entity';
import { MembershipBillingPeriodEntity } from './membership-billing-period.entity';

/**
 * Pricing catalog: every plan+period combination is an independent product entry.
 * total_price and discount_percentage are set per combination — no "base" price concept.
 * Admin can update pricing for each plan+period independently.
 */
@Entity({ name: 'membership_plan_billing_periods' })
@Index(['membership_plan_id'])
@Index(['billing_period_id'])
@Index(['is_active'])
export class MembershipPlanBillingPeriodEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  membership_plan_id: number;

  @ManyToOne(() => MembershipPlanEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'membership_plan_id' })
  membership_plan: MembershipPlanEntity;

  @Column({ type: 'int' })
  billing_period_id: number;

  @ManyToOne(() => MembershipBillingPeriodEntity, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'billing_period_id' })
  billing_period: MembershipBillingPeriodEntity;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
