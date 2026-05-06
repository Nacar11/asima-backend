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
import { DisputeEntity } from './dispute.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { DisputeMessageSenderRole } from '../../domain/dispute-message';

/**
 * DisputeMessage TypeORM entity.
 *
 * Represents the dispute_messages table. Stores threaded conversation
 * messages between customer, seller, and admin for a dispute.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'dispute_messages' })
@Index('IDX_dispute_messages_dispute_id', ['dispute_id'])
@Index('IDX_dispute_messages_sender_id', ['sender_id'])
export class DisputeMessageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  dispute_id: number;

  @ManyToOne(() => DisputeEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'dispute_id' })
  dispute: DisputeEntity;

  @Column({ type: 'int', nullable: false })
  sender_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  sender_role: DisputeMessageSenderRole;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'text', array: true, nullable: true })
  attachment_urls: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
