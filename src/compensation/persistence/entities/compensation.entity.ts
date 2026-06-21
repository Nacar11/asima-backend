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
import { ColumnNumericTransformer } from '@/utils/transformers/column-numeric.transformer';

/**
 * `employee_compensations` — effective-dated pay records. Mirrors the
 * `work_schedules` shape (effective_from/effective_to, audit, partial
 * unique index on the active row).
 *
 * The money columns are `select: false` (like `users.password_hash`): pay
 * is the most sensitive data in the system, so it is only ever loaded when
 * a finder explicitly `addSelect`s it — a careless join can't leak it.
 */
@Entity({ name: 'employee_compensations' })
@Index(['employee_id', 'effective_to'])
export class CompensationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: UserEntity;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  monthly_salary!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  hourly_rate!: number;

  @Column({ type: 'boolean', default: false })
  hourly_rate_is_overridden!: boolean;

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
