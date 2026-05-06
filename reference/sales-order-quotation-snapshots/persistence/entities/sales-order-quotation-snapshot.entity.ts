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
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';

/**
 * Sales Order Quotation Snapshot TypeORM entity.
 *
 * Stores immutable snapshot of quotation items when a sales order is created.
 * This preserves the exact state of what was quoted, independent of any
 * future modifications to the original quotation.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'sales_order_quotation_snapshots',
})
@Index(['sales_order_id'])
@Index(['sales_order_item_id'])
@Index(['source_quotation_id'])
@Index(['source_quotation_item_id'])
@Index(['deleted_at'])
export class SalesOrderQuotationSnapshotEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  // ==================== Sales Order References ====================

  @Column({ type: 'int', nullable: false })
  sales_order_id: number;

  @ManyToOne(() => SalesOrderEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity;

  @Column({ type: 'int', nullable: true })
  sales_order_item_id: number | null;

  @ManyToOne(() => SalesOrderItemEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item: SalesOrderItemEntity | null;

  // ==================== Source Quotation References ====================

  @Column({ type: 'int', nullable: false })
  source_quotation_id: number;

  @Column({ type: 'int', nullable: false })
  source_quotation_item_id: number;

  // ==================== Item Details (Snapshot) ====================

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'service or material',
  })
  item_type: string;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @Column({ type: 'int', nullable: true })
  product_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit_type: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  total_price: number;

  // ==================== Schedule Details (Snapshot) ====================

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date | null;

  @Column({ type: 'time', nullable: true })
  scheduled_start_time: string | null;

  // ==================== Service Address (Snapshot) ====================

  @Column({ type: 'int', nullable: true })
  service_address_id: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  service_address_text: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  service_latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  service_longitude: number | null;

  // ==================== Sequence ====================

  @Column({ type: 'int', nullable: true })
  sequence_order: number | null;

  // ==================== Audit Fields ====================

  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  deleted_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by_user: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
