import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ReturnRequestEntity } from './return-request.entity';
import { ReturnRequestItemStatusEnum } from '@/return-requests/domain/return-request-item-status.enum';

@Entity({
  name: 'return_request_items',
})
@Index(['return_request_id'])
@Index(['sales_order_item_id'])
@Index(['variant_id'])
@Index(['service_id'])
export class ReturnRequestItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  return_request_id: number;

  @ManyToOne(() => ReturnRequestEntity, (rr) => rr.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'return_request_id' })
  return_request: ReturnRequestEntity;

  @Column({ type: 'int', nullable: false })
  sales_order_item_id: number;

  @ManyToOne(() => SalesOrderItemEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item: SalesOrderItemEntity;

  @Column({ type: 'int', nullable: true })
  variant_id: number | null;

  @ManyToOne(() => ProductVariantEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariantEntity | null;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @Column({ type: 'int', nullable: false })
  quantity_ordered: number;

  @Column({ type: 'int', nullable: false })
  quantity_returning: number;

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
  return_amount: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReturnRequestItemStatusEnum.PENDING,
    nullable: false,
  })
  item_status: ReturnRequestItemStatusEnum;

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
}
