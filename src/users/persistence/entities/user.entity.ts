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
import { RoleEntity } from '@/roles/persistence/entities/role.entity';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['role_id'])
@Index(['is_active'])
export class UserEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * Bcrypt hash. `select: false` means TypeORM excludes this column from
   * any default `find` / `findOne`. Auth's login flow must use the
   * `findByEmailWithCredentials` repo method which calls `addSelect`.
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  /**
   * Freeform display title (e.g. "Senior PM", "Acting TD"). Per ADR 0001
   * this column must NEVER be read by auth or approval-routing logic.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;

  @Column({ type: 'int' })
  role_id: number;

  @ManyToOne(() => RoleEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  /**
   * Bypass flag — `PermissionsGuard` short-circuits when this is true.
   * Reserved for ops/infra (the seeded `admin@asima.inc`).
   */
  @Column({ type: 'boolean', default: false })
  system_admin: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  /**
   * Audit columns. Stored as nullable INT without an explicit FK
   * constraint — same trade-off as roles.entity.ts. Adding a self-ref FK
   * complicates the seed bootstrap (the very first super-admin has no
   * `created_by`). Deferred until a clear need shows up.
   */
  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @Column({ type: 'int', nullable: true })
  deleted_by: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
