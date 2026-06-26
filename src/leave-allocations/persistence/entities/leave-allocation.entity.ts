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
import { LEAVE_TYPES, LeaveType } from '@/leave-requests/leave-requests.constants';
import {
  ALLOCATION_SOURCES,
  AllocationSource,
} from '@/leave-allocations/leave-allocations.constants';

@Entity({ name: 'leave_allocations' })
@Index(['employee_id', 'leave_type'])
export class LeaveAllocationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({ type: 'enum', enum: Object.values(LEAVE_TYPES) })
  leave_type!: LeaveType;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'enum', enum: Object.values(ALLOCATION_SOURCES) })
  source!: AllocationSource;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({ type: 'int', nullable: true })
  granted_by!: number | null;

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
