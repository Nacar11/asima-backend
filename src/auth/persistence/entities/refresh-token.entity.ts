import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * `refresh_tokens` entity — the revocation ledger (ADR 0002). Stores NO secret
 * material: the `jti` claim of a refresh token plus its owner, expiry, and a
 * hard `revoked_at` timestamp. Infra rows, so no `created_by/updated_by` audit
 * columns and no soft delete. See migration 1778800000000-CreateRefreshTokensTable.
 */
@Entity({ name: 'refresh_tokens' })
@Index(['user_id', 'revoked_at'])
export class RefreshTokenEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid', unique: true })
  jti!: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  /** NULL = active. Stamped on rotation (single row) or logout (all rows). */
  @Column({ type: 'timestamptz', nullable: true })
  revoked_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
