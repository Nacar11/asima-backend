import {
  Column,
  CreateDateColumn,
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
 * `approval_chains` entity. No soft-delete columns — reassignment is the
 * logical-end mechanism (set `ended_at`). See migration
 * 1778300000000-CreateApprovalChainsTable and the 2026-05-30 plan §3.1.
 */
@Entity({ name: 'approval_chains' })
@Index(['employee_id', 'ended_at'])
@Index(['approver_id'])
export class ApprovalChainEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'int' })
  step!: number;

  @Column({ type: 'int' })
  approver_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approver_id' })
  approver!: UserEntity;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  effective_at!: Date;

  /** NULL = active. Stamped on reassignment (logical end). */
  @Column({ type: 'timestamptz', nullable: true })
  ended_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  created_by!: number | null;

  @Column({ type: 'int', nullable: true })
  updated_by!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
