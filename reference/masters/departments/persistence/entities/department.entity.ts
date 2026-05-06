import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

/**
 * TypeORM entity representing a department in the database.
 *
 * This entity defines the database structure for departments, including
 * all necessary fields, relationships, and constraints. It extends
 * EntityHelper for common audit functionality and includes relationships
 * with UserEntity for department head and audit fields.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new department entity
 * const department = new DepartmentEntity();
 * department.department_code = 'IT';
 * department.department_name = 'Information Technology';
 * department.department_head = userEntity;
 * department.status = StatusEnum.ACTIVE;
 * ```
 */
@Entity({
  name: 'department',
})
@Unique(['department_code'])
export class DepartmentEntity extends EntityHelper {
  /**
   * Primary key identifier for the department.
   *
   * Auto-generated unique identifier for each department record.
   * Used as the primary key in the database table.
   *
   * @example 1
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Unique department code identifier.
   *
   * A 2-character code that uniquely identifies the department.
   * Must be unique across all departments and follows the pattern
   * of numbers between 00 and 99.
   *
   * @example "01"
   */
  @Column({
    type: 'char',
    length: 2,
    unique: true,
    nullable: false,
  })
  department_code: string;

  /**
   * Human-readable name of the department.
   *
   * The full name of the department, used for display purposes
   * and in user interfaces. Maximum length is 100 characters.
   *
   * @example "Information Technology"
   */
  @Column({
    type: String,
    length: 100,
    nullable: false,
  })
  department_name: string;

  /**
   * User who serves as the department head.
   *
   * Reference to the UserEntity who is designated as the head
   * of this department. This relationship is eager-loaded for
   * performance and is required (not nullable).
   *
   * @example UserEntity with id: 1, first_name: "John", last_name: "Doe"
   */
  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'department_head' })
  department_head: UserEntity;

  /**
   * Current status of the department.
   *
   * Indicates whether the department is active, on hold, or cancelled.
   * Uses the StatusEnum for consistent status management across the system.
   * Defaults to ACTIVE when a new department is created.
   *
   * @example StatusEnum.ACTIVE
   */
  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
    nullable: false,
  })
  status: StatusEnum;

  /**
   * User who created this department record.
   *
   * Reference to the UserEntity who originally created this department.
   * This field is required and is used for audit purposes.
   *
   * @example UserEntity with id: 2, first_name: "Jane", last_name: "Smith"
   */
  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  /**
   * Timestamp when the department was created.
   *
   * Automatically set by TypeORM when the record is first created.
   * Used for audit purposes and tracking record creation time.
   *
   * @example "2024-01-15T10:30:00.000Z"
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * User who last updated this department record.
   *
   * Reference to the UserEntity who most recently modified this department.
   * This field is required and is used for audit purposes.
   *
   * @example UserEntity with id: 3, first_name: "Bob", last_name: "Johnson"
   */
  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  /**
   * Timestamp when the department was last updated.
   *
   * Automatically updated by TypeORM whenever the record is modified.
   * Used for audit purposes and tracking record modification time.
   *
   * @example "2024-01-20T14:45:00.000Z"
   */
  @UpdateDateColumn()
  updated_at: Date;

  /**
   * User who deleted this department record.
   *
   * Reference to the UserEntity who performed the soft delete operation.
   * This field is nullable and is only set when the department is soft deleted.
   * Used for audit purposes and tracking who deleted the record.
   *
   * @example UserEntity with id: 4, first_name: "Alice", last_name: "Brown" or null
   */
  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  /**
   * Timestamp when the department was soft deleted.
   *
   * Automatically set by TypeORM when the record is soft deleted.
   * This field is nullable and is only set when the department is soft deleted.
   * Used for audit purposes and tracking when the record was deleted.
   *
   * @example "2024-01-25T09:15:00.000Z" or null
   */
  @DeleteDateColumn()
  deleted_at?: Date | null;
}
