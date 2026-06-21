import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ColumnNumericTransformer } from '@/utils/transformers/column-numeric.transformer';
import { CompensationAuditAction } from '@/compensation/compensation.constants';

/**
 * `compensation_audits` — append-only trail of writes to
 * `employee_compensations`. One row per create / correct / delete, with the
 * before→after of the sensitive fields so an in-place correction still leaves
 * a record of what changed.
 *
 * The money columns are `select: false` (S1 parity with the comp table): pay
 * is only loaded when a finder `addSelect`s it. The table is immutable, so it
 * has no updated_at / deleted_at / updated_by — only actor_id + created_at.
 */
@Entity({ name: 'compensation_audits' })
@Index(['compensation_id'])
@Index(['employee_id'])
export class CompensationAuditEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  compensation_id!: number;

  @Column({ type: 'int' })
  employee_id!: number;

  @Column({ type: 'varchar', length: 16 })
  action!: CompensationAuditAction;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  before_monthly_salary!: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  after_monthly_salary!: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  before_hourly_rate!: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
    select: false,
    transformer: new ColumnNumericTransformer(),
  })
  after_hourly_rate!: number | null;

  @Column({ type: 'date', nullable: true })
  before_effective_from!: string | null;

  @Column({ type: 'date', nullable: true })
  after_effective_from!: string | null;

  @Column({ type: 'int', nullable: true })
  actor_id!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
