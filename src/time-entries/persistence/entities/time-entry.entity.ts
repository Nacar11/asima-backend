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
import { TimeEntrySource, TimeEntryStatus } from '@/time-entries/time-entries.constants';

@Entity({ name: 'time_entries' })
@Index(['employee_id', 'work_date'])
@Index(['employee_id', 'status'])
@Index(['work_date'])
export class TimeEntryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'date' })
  work_date!: string;

  @Column({ type: 'timestamptz' })
  time_in!: Date;

  /** NULL while status='open'. CHECK constraint ensures time_out > time_in. */
  @Column({ type: 'timestamptz', nullable: true })
  time_out!: Date | null;

  @Column({ type: 'enum', enum: ['manual', 'biometric', 'admin'], enumName: 'time_source' })
  source!: TimeEntrySource;

  @Column({
    type: 'enum',
    enum: ['open', 'confirmed'],
    enumName: 'time_entry_status',
    default: 'open',
  })
  status!: TimeEntryStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

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
