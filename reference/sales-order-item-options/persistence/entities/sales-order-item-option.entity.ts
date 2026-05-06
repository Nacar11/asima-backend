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
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'sales_order_item_options' })
@Index(['sales_order_item_id'])
export class SalesOrderItemOptionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  sales_order_item_id: number;

  @ManyToOne(() => SalesOrderItemEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item: SalesOrderItemEntity;

  @Column({ type: 'int', nullable: true })
  option_group_id: number | null;

  @ManyToOne(() => ServiceOptionGroupEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'option_group_id' })
  option_group: ServiceOptionGroupEntity | null;

  @Column({ type: 'int', nullable: true })
  option_value_id: number | null;

  @ManyToOne(() => ServiceOptionValueEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'option_value_id' })
  option_value: ServiceOptionValueEntity | null;

  // Snapshot fields (preserved even if option is deleted/modified later)
  @Column({ type: 'varchar', length: 255, nullable: false })
  group_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  group_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  value_label: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  value_code: string;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price_adjustment: number;

  @Column({ type: 'int', default: 0, nullable: false })
  duration_adjustment_minutes: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
