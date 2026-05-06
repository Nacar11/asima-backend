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
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Entity({ name: 'voucher_redemptions' })
@Index('IDX_voucher_redemptions_user_voucher_id', ['user_voucher_id'])
@Index('IDX_voucher_redemptions_user_id', ['user_id'])
@Index('IDX_voucher_redemptions_sales_order_id', ['sales_order_id'])
@Index('IDX_voucher_redemptions_booking_id', ['booking_id'])
@Index('IDX_voucher_redemptions_seller_id', ['seller_id'])
@Index('IDX_voucher_redemptions_redeemed_at', ['redeemed_at'])
export class VoucherRedemptionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  user_voucher_id: number;
  @ManyToOne(() => UserVoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_voucher_id' })
  user_voucher: UserVoucherEntity;
  @Column({ type: 'int', nullable: false })
  user_id: number;
  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @Column({ type: 'int', nullable: true })
  sales_order_id: number | null;
  @ManyToOne(() => SalesOrderEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity | null;
  @Column({ type: 'int', nullable: true })
  booking_id: number | null;
  @ManyToOne(() => BookingEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity | null;
  @Column({ type: 'int', nullable: true })
  seller_id: number | null;
  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  discount_amount: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  order_subtotal: number;
  @Column({ type: 'timestamptz', default: () => 'now()', nullable: false })
  redeemed_at: Date;
  @CreateDateColumn()
  created_at: Date;
}
