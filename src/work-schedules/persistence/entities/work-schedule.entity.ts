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
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

@Entity({ name: 'work_schedules' })
@Index(['employee_id', 'day_of_week'])
@Index(['employee_id', 'effective_to'])
export class WorkScheduleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'smallint' })
  day_of_week!: DayOfWeek;

  /** Stored as Postgres `time` (HH:MM:SS). Returned as a string by pg. */
  @Column({ type: 'time' })
  expected_in!: string;

  @Column({ type: 'time' })
  expected_out!: string;

  @Column({ type: 'int', default: 0 })
  break_minutes!: number;

  @Column({ type: 'date' })
  effective_from!: string;

  /** NULL = active. Setting this is the "logical end" of the row. */
  @Column({ type: 'date', nullable: true })
  effective_to!: string | null;

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
