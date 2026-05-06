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
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { MembershipPlanEntity } from './membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from './membership-plan-billing-period.entity';

/**
 * Membership persistence entity.
 */
@Entity({ name: 'memberships' })
@Index(['user_id'])
@Index(['status'])
@Index(['membership_plan_billing_period_id'])
@Index(['ends_at'])
export class MembershipEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int' })
  user_id: number;
  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @Column({ type: 'enum', enum: MembershipStatusEnum })
  status: MembershipStatusEnum;
  @Column({ type: 'int' })
  membership_plan_id: number;
  @ManyToOne(() => MembershipPlanEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'membership_plan_id' })
  membership_plan: MembershipPlanEntity;
  @Column({ type: 'int' })
  membership_plan_billing_period_id: number;
  @ManyToOne(() => MembershipPlanBillingPeriodEntity, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'membership_plan_billing_period_id' })
  membership_plan_billing_period: MembershipPlanBillingPeriodEntity;
  @Column({ type: 'timestamp', nullable: true })
  starts_at: Date | null;
  @Column({ type: 'timestamp', nullable: true })
  ends_at: Date | null;
  @Column({ type: 'timestamp', nullable: true })
  grace_ends_at: Date | null;
  @Column({ type: 'boolean', default: true })
  is_auto_renew_enabled: boolean;
  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;
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
