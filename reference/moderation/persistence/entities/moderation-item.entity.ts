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
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';

/**
 * ModerationItem TypeORM entity.
 *
 * Represents the moderation_items table. Items in the moderation queue.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'moderation_items',
})
@Index('IDX_moderation_items_content_type', ['content_type'])
@Index('IDX_moderation_items_content_id', ['content_id'])
@Index('IDX_moderation_items_status', ['status'])
@Index('IDX_moderation_items_priority', ['priority'])
@Index('IDX_moderation_items_created_at', ['created_at'])
@Index('IDX_moderation_items_content_type_id', ['content_type', 'content_id'])
export class ModerationItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ContentTypeEnum,
    nullable: false,
  })
  content_type: ContentTypeEnum;

  @Column({ type: 'int', nullable: false })
  content_id: number;

  @Column({ type: 'int', nullable: true })
  reported_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'reported_by' })
  reporter?: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  reported_reason: string | null;

  @Column({
    type: 'enum',
    enum: ModerationStatusEnum,
    default: ModerationStatusEnum.PENDING,
    nullable: false,
  })
  status: ModerationStatusEnum;

  @Column({
    type: 'enum',
    enum: ModerationPriorityEnum,
    default: ModerationPriorityEnum.MEDIUM,
    nullable: false,
  })
  priority: ModerationPriorityEnum;

  @Column({ type: 'int', nullable: true })
  reviewed_by: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
