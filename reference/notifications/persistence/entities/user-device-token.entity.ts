import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * User Device Token TypeORM entity.
 *
 * Stores FCM device tokens for push notifications.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'user_device_tokens' })
@Index('IDX_user_device_tokens_user_id', ['user_id'])
export class UserDeviceTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 500, unique: true })
  @Index('IDX_user_device_tokens_token', { unique: true })
  device_token: string;

  @Column({ length: 20, default: 'mobile' })
  device_type: string;

  @Column({ length: 100, nullable: true })
  device_name?: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
