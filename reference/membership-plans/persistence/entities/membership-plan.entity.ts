import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';

/**
 * Membership plan persistence entity.
 */
@Entity({ name: 'membership_plans' })
@Index(['plan_code'], { unique: true })
@Index(['is_active'])
export class MembershipPlanEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  plan_code: string;

  @Column({ type: 'varchar', length: 255 })
  plan_name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', nullable: true })
  @Index()
  created_by?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'integer', nullable: true })
  @Index()
  updated_by?: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'integer', nullable: true })
  @Index()
  deleted_by?: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;

  @OneToMany(
    () => MembershipVoucherConfigurationEntity,
    (configuration) => configuration.membership_plan,
  )
  membership_voucher_configurations?: MembershipVoucherConfigurationEntity[];
}
