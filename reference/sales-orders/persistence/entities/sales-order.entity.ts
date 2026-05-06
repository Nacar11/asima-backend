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
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { SalesOrderItemEntity } from './sales-order-item.entity';

/**
 * Sales Order TypeORM entity
 * Stores customer orders created from shopping cart checkout
 */
@Entity({
  name: 'sales_orders',
})
@Index(['order_number'], { unique: true })
@Index(['user_id', 'idempotency_key'], {
  unique: true,
  where: 'idempotency_key IS NOT NULL',
})
@Index(['user_id'])
@Index(['seller_id'])
@Index(['status'])
@Index(['created_at'])
@Index(['source_quotation_id'])
@Index(['deleted_at'])
export class SalesOrderEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  order_number: string;

  @Column({ type: 'uuid', nullable: true })
  idempotency_key: string | null;

  @Column({
    type: 'varchar',
    default: OrderStatusEnum.PENDING,
    nullable: false,
  })
  status: OrderStatusEnum;

  @Column({ type: 'text', nullable: true })
  status_notes: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  tax_amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  shipping_amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  total_amount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    nullable: false,
    comment: 'Commission rate snapshot at order placement time',
  })
  commission_rate: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  shipping_address: string | null;

  // Shipping address snapshot columns (per e-commerce address architecture PRD)
  @Index('idx_sales_orders_user_address_id')
  @Column({ type: 'int', nullable: true })
  user_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_address_id' })
  user_address: UserAddressEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_recipient_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shipping_phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_address_line1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_address_line2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_state_province: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shipping_postal_code: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_country: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_method: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shipping_provider: string | null;

  @Column({ type: 'timestamp', nullable: true })
  shipped_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', nullable: true })
  review_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  // ==================== Payment Fields ====================

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string | null;

  @Column({ type: 'varchar', length: 30, default: 'pending', nullable: false })
  @Index('IDX_sales_orders_payment_status')
  payment_status: string;

  // ==================== End Payment Fields ====================

  // ==================== MEPF Flow Fields ====================

  /**
   * FK to quote_requests table.
   * The quotation this sales order was created from (when customer accepts quotation).
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_id: number | null;

  // ==================== End MEPF Flow Fields ====================

  // ==================== Checkout Source ====================

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('IDX_sales_orders_checkout_source')
  checkout_source: string | null;

  // ==================== End Checkout Source ====================

  // ==================== Pickup Fulfillment ====================

  @Column({ type: 'varchar', length: 20, default: 'delivery', nullable: false })
  @Index('IDX_sales_orders_fulfillment_type')
  fulfillment_type: string;

  @Column({ type: 'date', nullable: true })
  pickup_date: Date | null;

  @Column({ type: 'time', nullable: true })
  pickup_time: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pickup_notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ready_for_pickup_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pickup_reminder_notified_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  noshow_warning_1_notified_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  noshow_warning_2_notified_at: Date | null;

  @Column({ type: 'int', nullable: true })
  grace_period_extension: number | null;

  @Column({ type: 'varchar', length: 4, nullable: true, unique: true })
  pickup_confirmation_code: string | null;

  // ==================== End Pickup Fulfillment ====================

  @OneToMany(() => SalesOrderItemEntity, (item) => item.order, {
    eager: false,
    cascade: true,
  })
  items: SalesOrderItemEntity[];

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
