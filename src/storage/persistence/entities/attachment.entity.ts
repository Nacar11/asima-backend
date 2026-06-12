import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { AttachmentKind } from '@/storage/attachment.constants';

/**
 * Generic stored-file row. Not leave-specific — the leave module references
 * it via `leave_requests.attachment_id`, and future consumers reuse it.
 */
@Entity({ name: 'attachments' })
export class AttachmentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  bucket!: string;

  /** UUID-based key prefix (`leave-attachments/<uuid>`); NOT the DB id. */
  @Column({ type: 'text' })
  object_key_prefix!: string;

  @Column({ type: 'text' })
  original_filename!: string;

  @Column({ type: 'text' })
  content_type!: string;

  @Column({ type: 'int' })
  size_bytes!: number;

  @Column({ type: 'enum', enum: ['image', 'pdf'] })
  kind!: AttachmentKind;

  @Column({ type: 'boolean' })
  has_versions!: boolean;

  @Column({ type: 'int' })
  owner_id!: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity;

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
