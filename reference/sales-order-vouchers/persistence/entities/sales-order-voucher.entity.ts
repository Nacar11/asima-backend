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
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';

@Entity({ name: 'sales_order_vouchers' })
@Index('IDX_sales_order_vouchers_sales_order_id', ['sales_order_id'])
@Index('IDX_sales_order_vouchers_user_voucher_id', ['user_voucher_id'])
@Index('IDX_sales_order_vouchers_voucher_code', ['voucher_code'])
@Index(
  'UQ_sales_order_vouchers_sales_order_id_user_voucher_id',
  ['sales_order_id', 'user_voucher_id'],
  {
    unique: true,
  },
)
export class SalesOrderVoucherEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  sales_order_id: number;
  @ManyToOne(() => SalesOrderEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity;
  @Column({ type: 'int', nullable: false })
  user_voucher_id: number;
  @ManyToOne(() => UserVoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_voucher_id' })
  user_voucher: UserVoucherEntity;
  @Column({ type: 'varchar', length: 20, nullable: false })
  voucher_code: string;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  voucher_discount: number;
  @CreateDateColumn()
  created_at: Date;
}
