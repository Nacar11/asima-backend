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
import { SalesOrderEntity } from './sales-order.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { SalesOrderItemAddonEntity } from '@/sales-order-item-addons/persistence/entities/sales-order-item-addon.entity';
import { SalesOrderItemOptionEntity } from '@/sales-order-item-options/persistence/entities/sales-order-item-option.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';

/**
 * Sales Order Item TypeORM entity
 * Stores individual line items within an order with price snapshot.
 * Supports both product items (with variant_id) and service items (with service_id).
 *
 * @version 2
 * @since 1.0.0
 */
@Entity({
  name: 'sales_order_items',
})
@Index(['order_id'])
@Index(['variant_id'])
@Index(['service_id'])
@Index(['order_id', 'variant_id'])
@Index(['order_id', 'item_type'])
@Index(['item_type'])
@Index(['source_quotation_id'])
@Index(['source_quotation_item_id'])
@Index(['deleted_at'])
export class SalesOrderItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  order_id: number;

  @ManyToOne(() => SalesOrderEntity, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrderEntity;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: CartItemTypeEnum,
    default: CartItemTypeEnum.PRODUCT,
  })
  item_type: CartItemTypeEnum;

  @Column({ type: 'int', nullable: true })
  variant_id: number | null;

  @ManyToOne(() => ProductVariantEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariantEntity | null;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @Column({ type: 'int', nullable: true })
  package_id: number | null;

  @ManyToOne(() => ServicePackageEntity, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'package_id' })
  package: ServicePackageEntity | null;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduled_date: Date | null;

  @Column({ name: 'scheduled_start_time', type: 'time', nullable: true })
  scheduled_start_time: string | null;

  @Column({ name: 'service_address_id', nullable: true })
  service_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, {
    onDelete: 'SET NULL',
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'service_address_id' })
  service_address: UserAddressEntity | null;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  special_requests: string | null;

  @Column({
    name: 'location_additional_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  location_additional_fee: number | null;

  @Column({
    name: 'appointment_location_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  appointment_location_type: string | null;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  quantity_returned: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  total_price: number;

  // ==================== MEPF Flow Fields ====================

  /**
   * FK to quote_requests table.
   * The quotation this sales order item was created from.
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_id: number | null;

  /**
   * FK to quotation_items table.
   * The specific quotation line item this sales order item was created from.
   */
  @Column({ type: 'int', nullable: true })
  source_quotation_item_id: number | null;

  // ==================== End MEPF Flow Fields ====================

  @OneToMany(() => SalesOrderItemAddonEntity, (addon) => addon.sales_order_item)
  addons: SalesOrderItemAddonEntity[];

  @OneToMany(
    () => SalesOrderItemOptionEntity,
    (option) => option.sales_order_item,
  )
  options: SalesOrderItemOptionEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.sales_order_item)
  reviews: ReviewEntity[];

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
