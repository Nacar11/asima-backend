import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CheckoutPaymentEntity } from './checkout-payment.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';

/**
 * Join table linking a checkout payment to one or more sales orders.
 *
 * A single payment can cover multiple sales orders when a cart contains items
 * from multiple sellers (each seller creates a separate sales order, but the
 * customer pays once). is_primary=true marks the order that "owns" the payment
 * for legacy compatibility.
 */
@Entity({ name: 'checkout_payment_orders' })
@Index('IDX_checkout_payment_orders_payment_id', ['checkout_payment_id'])
@Index('IDX_checkout_payment_orders_sales_order_id', ['sales_order_id'])
export class CheckoutPaymentOrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  checkout_payment_id: number;

  @ManyToOne(() => CheckoutPaymentEntity, (p) => p.payment_orders, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'checkout_payment_id' })
  checkout_payment: CheckoutPaymentEntity;

  @Column({ type: 'int', nullable: false })
  sales_order_id: number;

  @ManyToOne(() => SalesOrderEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity;

  /** True for the order that initiated the payment (first seller in multi-seller cart). */
  @Column({ type: 'boolean', default: false, nullable: false })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
