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
import { ColumnNumericTransformer } from '@/utils/transformers/column-numeric.transformer';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import {
  DayPortion,
  DecisionPath,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

@Entity({ name: 'leave_requests' })
@Index(['employee_id', 'status'])
@Index(['status', 'submitted_at'])
export class LeaveRequestEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'enum', enum: ['vacation', 'sick', 'bereavement', 'birthday', 'emergency'] })
  leave_type!: LeaveType;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  /**
   * Chargeable working days. `numeric(4,1)` so a half day is `0.5`. pg
   * returns numeric as a string — the transformer keeps the domain a number.
   */
  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    transformer: new ColumnNumericTransformer(),
  })
  working_days!: number;

  /** full | first_half | second_half. Half-days are single-day only (DB CHECK). */
  @Column({
    type: 'enum',
    enum: ['full', 'first_half', 'second_half'],
    default: 'full',
  })
  day_portion!: DayPortion;

  /** Snapshot of the half-day window start (HH:MM:SS), NULL for a full day. */
  @Column({ type: 'time', nullable: true })
  start_time!: string | null;

  /** Snapshot of the half-day window end (HH:MM:SS), NULL for a full day. */
  @Column({ type: 'time', nullable: true })
  end_time!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({
    type: 'enum',
    enum: ['pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled'],
    default: 'pending_l1',
  })
  status!: LeaveRequestStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submitted_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  decided_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  decided_by!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  decision_note!: string | null;

  @Column({ type: 'enum', enum: ['chain', 'override'], nullable: true })
  decision_path!: DecisionPath | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  cancelled_by!: number | null;

  @Column({ type: 'int' })
  l1_approver_id!: number;

  @Column({ type: 'int', nullable: true })
  l2_approver_id!: number | null;

  @Column({ type: 'int', nullable: true })
  created_by!: number | null;

  @Column({ type: 'int', nullable: true })
  updated_by!: number | null;

  @Column({ type: 'int', nullable: true })
  deleted_by!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at!: Date | null;
}
