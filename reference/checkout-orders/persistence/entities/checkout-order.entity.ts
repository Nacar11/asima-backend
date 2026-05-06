import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { CheckoutStatusEnum } from '@/checkout-orders/enums/checkout-status.enum';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';

/**
 * Checkout Order TypeORM entity.
 *
 * Represents the checkout_orders table. A unified order created at checkout
 * that can contain both products and services. Tracks order status, payment
 * status, totals, and addresses for delivery/service.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'checkout_orders',
})
@Index('IDX_checkout_orders_user_id', ['user_id'])
@Index('IDX_checkout_orders_order_number', ['order_number'], { unique: true })
@Index('IDX_checkout_orders_status', ['status'])
@Index('IDX_checkout_orders_payment_status', ['payment_status'])
@Index('IDX_checkout_orders_created_at', ['created_at'])
@Index('IDX_checkout_orders_deleted_at', ['deleted_at'])
export class CheckoutOrderEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  order_number: string;

  // Order Contents
  @Column({ type: 'boolean', default: false, nullable: false })
  has_products: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  has_services: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  has_bundles: boolean;

  // Totals
  @Column({
    type: 'decimal',
    precision: 12,
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
  discount_total: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  shipping_total: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  tax_total: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  platform_fee_total: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  grand_total: number;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  // Status
  @Column({
    type: 'enum',
    enum: CheckoutStatusEnum,
    default: CheckoutStatusEnum.PENDING,
    nullable: false,
  })
  status: CheckoutStatusEnum;

  @Column({
    type: 'enum',
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.PENDING,
    nullable: false,
  })
  payment_status: PaymentStatusEnum;

  // Delivery Address (for products)
  @Column({ type: 'int', nullable: true })
  delivery_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'delivery_address_id' })
  delivery_address: UserAddressEntity | null;

  // Service Address (for services)
  @Column({ type: 'int', nullable: true })
  service_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'service_address_id' })
  service_address: UserAddressEntity | null;

  // Notes
  @Column({ type: 'text', nullable: true })
  customer_notes: string | null;

  @Column({ type: 'text', nullable: true })
  internal_notes: string | null;

  // Timestamps
  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  // Source
  @Column({
    type: 'varchar',
    length: 50,
    default: 'mobile_app',
    nullable: false,
  })
  source: string;

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
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
