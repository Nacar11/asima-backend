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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';

/**
 * Order Tracking Event TypeORM entity
 * Stores immutable audit trail of all order status changes
 */
@Entity({
  name: 'order_tracking_events',
})
@Index(['order_id'])
@Index(['event_type'])
@Index(['event_timestamp'])
@Index(['order_id', 'event_timestamp'])
export class OrderTrackingEventEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  order_id: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  event_type: OrderEventTypeEnum;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  event_timestamp: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;
}
