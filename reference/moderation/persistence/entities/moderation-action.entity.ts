import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ModerationItemEntity } from '@/moderation/persistence/entities/moderation-item.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ModerationActionTypeEnum } from '@/moderation/enums/moderation-action-type.enum';

/**
 * ModerationAction TypeORM entity.
 *
 * Represents the moderation_actions table. Actions taken on moderation items.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'moderation_actions',
})
@Index('IDX_moderation_actions_moderation_item_id', ['moderation_item_id'])
@Index('IDX_moderation_actions_performed_at', ['performed_at'])
export class ModerationActionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  moderation_item_id: number;

  @ManyToOne(() => ModerationItemEntity, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moderation_item_id' })
  moderation_item: ModerationItemEntity;

  @Column({
    type: 'enum',
    enum: ModerationActionTypeEnum,
    nullable: false,
  })
  action: ModerationActionTypeEnum;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @Column({ type: 'int', nullable: false })
  performed_by: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'performed_by' })
  performer: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  performed_at: Date;
}
