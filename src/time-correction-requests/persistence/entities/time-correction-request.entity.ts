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
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import {
  TcDecisionPath,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';

@Entity({ name: 'time_correction_requests' })
@Index(['employee_id', 'status'])
@Index(['employee_id', 'work_date'])
@Index(['status', 'submitted_at'])
export class TimeCorrectionRequestEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'int', nullable: true })
  target_entry_id!: number | null;

  @ManyToOne(() => TimeEntryEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_entry_id' })
  target_entry!: TimeEntryEntity | null;

  @Column({ type: 'date' })
  work_date!: string;

  @Column({ type: 'timestamptz' })
  proposed_time_in!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  proposed_time_out!: Date | null;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({
    type: 'enum',
    enum: ['pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled'],
    enumName: 'time_correction_status',
    default: 'pending_l1',
  })
  status!: TimeCorrectionStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submitted_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  decided_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  decided_by!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  decision_note!: string | null;

  @Column({ type: 'enum', enum: ['chain', 'override'], enumName: 'decision_path', nullable: true })
  decision_path!: TcDecisionPath | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  cancelled_by!: number | null;

  @Column({ type: 'int' })
  l1_approver_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'l1_approver_id' })
  l1_approver!: UserEntity;

  @Column({ type: 'int', nullable: true })
  l2_approver_id!: number | null;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'l2_approver_id' })
  l2_approver!: UserEntity | null;

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
