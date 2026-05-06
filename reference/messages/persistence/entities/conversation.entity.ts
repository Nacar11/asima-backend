import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ConversationStatusEnum } from '@/messages/enums/conversation-status.enum';
import { ContextTypeEnum } from '@/messages/enums/context-type.enum';
import { MessageEntity } from '@/messages/persistence/entities/message.entity';

/**
 * Conversation TypeORM entity.
 *
 * Represents the conversations table. A conversation between a seller and customer.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'conversations',
})
@Index('IDX_conversations_seller_id', ['seller_id'])
@Index('IDX_conversations_customer_id', ['customer_id'])
@Index('IDX_conversations_last_message_at', ['last_message_at'])
@Index('IDX_conversations_status', ['status'])
@Index('IDX_conversations_context', ['context_type', 'context_id'])
@Unique('UQ_conversations_participants_context', [
  'seller_id',
  'customer_id',
  'context_type',
  'context_id',
])
export class ConversationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({
    type: 'enum',
    enum: ContextTypeEnum,
    nullable: true,
  })
  context_type: ContextTypeEnum | null;

  @Column({ type: 'int', nullable: true })
  context_id: number | null;

  @Column({
    type: 'enum',
    enum: ConversationStatusEnum,
    default: ConversationStatusEnum.ACTIVE,
    nullable: false,
  })
  status: ConversationStatusEnum;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  last_message_at: Date | null;

  @OneToMany(() => MessageEntity, (message) => message.conversation, {
    cascade: false,
  })
  messages: MessageEntity[];

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
