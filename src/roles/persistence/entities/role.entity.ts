import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';

@Entity({ name: 'roles' })
@Index(['name'], { unique: true })
export class RoleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @ManyToMany(() => PermissionEntity, { eager: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: PermissionEntity[];

  /**
   * Audit columns. Stored as nullable INT now (no FK constraint) because the
   * `users` table doesn't exist yet at Task 3 time. The FK is added in Task 4's
   * migration once UserEntity lands. See tasks/plan.md §architecture decision 9.
   */
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
