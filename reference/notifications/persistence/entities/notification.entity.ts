import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Notification TypeORM entity.
 *
 * Represents the notifications table. Tracks in-app and push notifications
 * for users about bookings, milestones, payments, etc.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'notifications',
})
@Index('IDX_notifications_user_id', ['user_id'])
@Index('IDX_notifications_type', ['type'])
@Index('IDX_notifications_read_at', ['read_at'])
@Index('IDX_notifications_created_at', ['created_at'])
@Index('IDX_notifications_status', ['status'])
export class NotificationEntity {
  @Column({ type: 'int', primary: true, generated: true })
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  entity_type: string | null;

  @Column({ type: 'int', nullable: true })
  entity_id: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  action_url: string | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  push_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  push_sent_at: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @Column({ type: 'timestamp', nullable: false, default: () => 'now()' })
  created_at: Date;
}
