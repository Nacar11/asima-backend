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
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';

/**
 * SubscriptionOperation TypeORM entity.
 *
 * Represents the subscription_operations table. Tracks admin operations on subscriptions.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'subscription_operations',
})
@Index('IDX_subscription_operations_subscription_id', ['subscription_id'])
@Index('IDX_subscription_operations_operation_type', ['operation_type'])
@Index('IDX_subscription_operations_performed_at', ['performed_at'])
@Index('IDX_subscription_operations_performed_by', ['performed_by'])
export class SubscriptionOperationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  subscription_id: number;

  @ManyToOne(() => SubscriptionEntity, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;

  @Column({
    type: 'enum',
    enum: SubscriptionOperationTypeEnum,
    nullable: false,
  })
  operation_type: SubscriptionOperationTypeEnum;

  @Column({ type: 'int', nullable: false })
  performed_by: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'performed_by' })
  performer: UserEntity;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  performed_at: Date;
}
