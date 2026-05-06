import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { DivisionEntity } from '@/masters/divisions/persistence/entities/division.entity';
import { DepartmentEntity } from '@/masters/departments/persistence/entities/department.entity';
import { SectionEntity } from '@/masters/sections/persistence/entities/section.entity';
import { SubSectionEntity } from '@/masters/sub-sections/persistence/entities/sub-section.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * TypeORM entity representing a cost center in the database.
 *
 * This entity maps to the 'cost_center' table and represents the persistence
 * layer for cost centers. It includes all database columns, relationships,
 * and computed properties for cost center management.
 *
 * The entity enforces unique constraints on the cost_center_code and includes
 * relationships to organizational entities (division, department, section, sub-section)
 * and audit fields (created_by, updated_by, deleted_by).
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const costCenter = new CostCenterEntity();
 * costCenter.cost_center_code = '01010101';
 * costCenter.division = divisionEntity;
 * costCenter.status = StatusEnum.ACTIVE;
 * ```
 */
@Entity({
  name: 'cost_center',
})
@Unique(['cost_center_code'])
export class CostCenterEntity extends EntityHelper {
  /** Unique identifier for the cost center */
  @PrimaryGeneratedColumn()
  id: number;

  /** Unique cost center code generated from organizational structure */
  @Column({
    type: String,
    length: 12,
    unique: true,
    nullable: false,
  })
  cost_center_code: string;

  /** Associated division entity (required) */
  @ManyToOne(() => DivisionEntity, { nullable: false })
  @JoinColumn({ name: 'division', referencedColumnName: 'id' })
  division: DivisionEntity;

  /** Associated department entity (optional) */
  @ManyToOne(() => DepartmentEntity, { nullable: true })
  @JoinColumn({ name: 'department', referencedColumnName: 'id' })
  department: DepartmentEntity;

  /** Associated section entity (optional) */
  @ManyToOne(() => SectionEntity, { nullable: true })
  @JoinColumn({ name: 'section', referencedColumnName: 'id' })
  section: SectionEntity;

  /** Associated sub-section entity (optional) */
  @ManyToOne(() => SubSectionEntity, { nullable: true })
  @JoinColumn({ name: 'sub_section', referencedColumnName: 'id' })
  sub_section: SubSectionEntity;

  /** Additional remarks or description for the cost center */
  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string | null;

  /** Current status of the cost center (Active, Hold, Cancelled) */
  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
    nullable: false,
  })
  status: StatusEnum;

  /** User who created the cost center */
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  /** Timestamp when the cost center was created */
  @CreateDateColumn()
  created_at: Date;

  /** User who last updated the cost center */
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  /** Timestamp when the cost center was last updated */
  @UpdateDateColumn()
  updated_at: Date;

  /** User who deleted the cost center (if soft deleted) */
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  /** Timestamp when the cost center was deleted (if soft deleted) */
  @DeleteDateColumn()
  deleted_at?: Date | null;

  /**
   * Gets the cost center name from the lowest level organizational entity.
   *
   * Returns the name of the most specific organizational entity (sub-section > section > department > division).
   *
   * @returns string | undefined - The name of the lowest level organizational entity
   */
  get costCenterName(): string | undefined {
    const entities: (string | null)[] = [
      this.division?.division_name ?? null,
      this.department?.department_name ?? null,
      this.section?.section_name ?? null,
      this.sub_section?.sub_section_name ?? null,
    ];

    const name = entities.filter((entity) => entity != null);

    return name.pop();
  }

  /**
   * Gets the full cost center name combining code and organizational name.
   *
   * Returns a formatted string combining the cost center code with the
   * organizational entity name (e.g., "01010101 / Backend").
   *
   * @returns string | undefined - The full cost center name with code and organizational name
   */
  get costCenterFullName(): string | undefined {
    return `${this.cost_center_code} / ${this.costCenterName}`;
  }
}
