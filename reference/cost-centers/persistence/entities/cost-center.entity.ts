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
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * Cost Center Entity
 *
 * TypeORM entity representing the cost_center table in the database.
 * Maps the hierarchical organization structure with relationships to
 * division, department, section, and sub-section entities.
 *
 * Includes audit fields for tracking creation, updates, and soft deletion
 * with user information for complete audit trails.
 *
 * @example
 * ```typescript
 * const costCenter = new CostCenterEntity();
 * costCenter.cost_center_code = '01010101';
 * costCenter.division = divisionEntity;
 * costCenter.department = departmentEntity;
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@Entity({
  name: 'cost_center',
})
@Unique(['cost_center_code'])
export class CostCenterEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: String,
    length: 12,
    unique: true,
    nullable: false,
  })
  cost_center_code: string;

  @ManyToOne(() => DivisionEntity, { nullable: false })
  @JoinColumn({ name: 'division', referencedColumnName: 'id' })
  division: DivisionEntity;

  @ManyToOne(() => DepartmentEntity, { nullable: true })
  @JoinColumn({ name: 'department', referencedColumnName: 'id' })
  department: DepartmentEntity;

  @ManyToOne(() => SectionEntity, { nullable: true })
  @JoinColumn({ name: 'section', referencedColumnName: 'id' })
  section: SectionEntity;

  @ManyToOne(() => SubSectionEntity, { nullable: true })
  @JoinColumn({ name: 'sub_section', referencedColumnName: 'id' })
  sub_section: SubSectionEntity;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string | null;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
    nullable: false,
  })
  status: StatusEnum;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;

  // Getters
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

  get costCenterFullName(): string | undefined {
    return `${this.cost_center_code} / ${this.costCenterName}`;
  }
}
