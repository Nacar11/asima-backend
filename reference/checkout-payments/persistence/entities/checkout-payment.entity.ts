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
import { CheckoutPaymentOrderEntity } from './checkout-payment-order.entity';
import { EntityHelper } from '@/utils/entity-helper';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CheckoutPaymentStatusEnum } from '../../enums/checkout-payment-status.enum';

/**
 * Checkout Payment TypeORM entity.
 *
 * Represents the checkout_payments table. Tracks payment transactions for
 * checkout orders, including gateway details, amounts, refunds, and chargebacks.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'checkout_payments',
})
@Index('IDX_checkout_payments_checkout_order_id', ['checkout_order_id'])
@Index('IDX_checkout_payments_transaction_number', ['transaction_number'], {
  unique: true,
})
@Index('IDX_checkout_payments_status', ['status'])
@Index('IDX_checkout_payments_gateway_transaction_id', [
  'gateway_transaction_id',
])
@Index('IDX_checkout_payments_payment_method_code', ['payment_method_code'])
@Index('IDX_checkout_payments_payment_type', ['payment_type'])
@Index('IDX_checkout_payments_paid_at', ['paid_at'])
export class CheckoutPaymentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  checkout_order_id: number | null;

  @ManyToOne(() => CheckoutOrderEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'checkout_order_id' })
  checkout_order: CheckoutOrderEntity | null;

  @Column({ type: 'int', nullable: true })
  sales_order_id: number | null;

  @ManyToOne(() => SalesOrderEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity | null;

  /** All sales orders covered by this payment (multi-seller cart support). */
  @OneToMany(() => CheckoutPaymentOrderEntity, (o) => o.checkout_payment, {
    eager: false,
  })
  payment_orders: CheckoutPaymentOrderEntity[];

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  transaction_number: string | null;

  @Column({ type: 'varchar', length: 30, nullable: false })
  payment_method_code: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'paymongo',
    nullable: false,
  })
  payment_gateway: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_transaction_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_reference_number: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  gateway_checkout_url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gateway_response: any | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'full',
    nullable: false,
  })
  payment_type: string;

  @Column({ type: 'int', nullable: true })
  installment_id: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  gateway_fee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  net_amount: number | null;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({
    type: 'enum',
    enum: CheckoutPaymentStatusEnum,
    default: CheckoutPaymentStatusEnum.PENDING,
    nullable: false,
  })
  status: CheckoutPaymentStatusEnum;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failure_code: string | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  initiated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  total_refunded: number;

  @Column({ type: 'int', default: 0, nullable: false })
  refund_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_refund_at: Date | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_fully_refunded: boolean;

  @Column({ type: 'timestamp', nullable: true })
  chargeback_at: Date | null;

  @Column({ type: 'text', nullable: true })
  chargeback_reason: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  chargeback_amount: number | null;

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
