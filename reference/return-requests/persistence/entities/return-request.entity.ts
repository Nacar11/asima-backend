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
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';
import { ReturnRequestItemEntity } from './return-request-item.entity';
import { ReturnRequestMediaMappingEntity } from '@/media/persistence/entities/return-request-media-mapping.entity';

@Entity({
  name: 'return_requests',
})
@Index(['order_id'])
@Index(['user_id'])
@Index(['seller_id'])
@Index(['status'])
@Index(['return_number'])
@Index(['deleted_at'])
export class ReturnRequestEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  order_id: number;

  @ManyToOne(() => SalesOrderEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrderEntity;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  return_number: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: ReturnRequestStatusEnum.PENDING,
    nullable: false,
  })
  status: ReturnRequestStatusEnum;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'text', nullable: true })
  approval_notes: string | null;

  @Column({ type: 'varchar', length: 50, nullable: false })
  previous_order_status: string;

  @Column({ type: 'timestamp', nullable: true })
  pickup_scheduled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pickup_scheduled_date: Date | null;

  @Column({ type: 'int', nullable: true })
  pickup_scheduled_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'pickup_scheduled_by' })
  pickup_scheduled_by_user: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  pickup_notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at: Date | null;

  @Column({ type: 'int', nullable: true })
  picked_up_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'picked_up_by' })
  picked_up_by_user: UserEntity | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  calculated_refund_amount: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  actual_refund_amount: number | null;

  @Column({ type: 'text', nullable: true })
  refund_notes: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requested_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'int', nullable: true })
  approved_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approved_by_user: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date | null;

  @Column({ type: 'int', nullable: true })
  rejected_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejected_by_user: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date | null;

  @Column({ type: 'int', nullable: true })
  received_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'received_by' })
  received_by_user: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date | null;

  @Column({ type: 'int', nullable: true })
  refunded_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'refunded_by' })
  refunded_by_user: UserEntity | null;

  // ==================== Payment Refund Tracking ====================

  @Column({ type: 'varchar', length: 30, nullable: true })
  payment_refund_status: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  payment_refund_method: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  payment_refund_amount: number | null;

  @Column({ type: 'timestamp', nullable: true })
  payment_refund_at: Date | null;

  @Column({ type: 'int', nullable: true })
  payment_refund_by: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_refund_reference: string | null;

  // ==================== End Payment Refund Tracking ====================

  @OneToMany(() => ReturnRequestItemEntity, (item) => item.return_request, {
    eager: false,
    cascade: true,
  })
  items: ReturnRequestItemEntity[];

  @OneToMany(
    () => ReturnRequestMediaMappingEntity,
    (mapping) => mapping.return_request,
    {
      eager: false,
    },
  )
  media_mappings: ReturnRequestMediaMappingEntity[];

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;
}
