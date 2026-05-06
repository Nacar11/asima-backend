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
import { ConversationEntity } from '@/messages/persistence/entities/conversation.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MessageTypeEnum } from '@/messages/enums/message-type.enum';

/**
 * Message TypeORM entity.
 *
 * Represents the messages table. A single message in a conversation.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'messages',
})
@Index('IDX_messages_conversation_id', ['conversation_id'])
@Index('IDX_messages_sender_id', ['sender_id'])
@Index('IDX_messages_created_at', ['created_at'])
@Index('IDX_messages_read_at', ['read_at'])
export class MessageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  conversation_id: number;

  @ManyToOne(() => ConversationEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  @Column({ type: 'int', nullable: false })
  sender_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({
    type: 'enum',
    enum: MessageTypeEnum,
    default: MessageTypeEnum.TEXT,
    nullable: false,
  })
  message_type: MessageTypeEnum;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attachments: any | null;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
