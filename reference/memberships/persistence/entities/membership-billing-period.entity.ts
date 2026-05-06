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

/**
 * Membership billing period persistence entity.
 * Defines available period types (monthly, quarterly, semi_annual, annual).
 * Duration info only — pricing lives in membership_plan_billing_periods.
 */
@Entity({ name: 'membership_billing_periods' })
@Index(['period_code'], { unique: true })
@Index(['is_active'])
@Index(['sort_order'])
export class MembershipBillingPeriodEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  period_code: string;

  @Column({ type: 'varchar', length: 100 })
  period_name: string;

  @Column({ type: 'int' })
  duration_in_months: number;

  @Column({ type: 'int' })
  duration_in_days: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

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
