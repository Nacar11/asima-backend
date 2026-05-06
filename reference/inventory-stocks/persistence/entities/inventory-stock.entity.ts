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
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Inventory Stock TypeORM entity
 */
@Entity({
  name: 'inventory_stocks',
})
@Index('idx_inventory_stocks_variant_id', ['variant_id'], { unique: true })
@Index('idx_inventory_stocks_stock_quantity', ['stock_quantity'])
@Index('idx_inventory_stocks_available_quantity', ['available_quantity'])
@Index('idx_inventory_stocks_stock_on_hand', ['stock_on_hand'])
export class InventoryStockEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'variant_id', unique: true })
  variant_id: number;

  @ManyToOne(() => ProductVariantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariantEntity;

  @Column({ name: 'stock_on_hand', default: 0 })
  stock_on_hand: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stock_quantity: number;

  @Column({ name: 'reserved_quantity', default: 0 })
  reserved_quantity: number;

  @Column({ name: 'available_quantity', default: 0 })
  available_quantity: number;

  @Column({ name: 'min_stock_level', default: 0 })
  min_stock_level: number;

  @Column({ name: 'last_counted_at', type: 'timestamp', nullable: true })
  last_counted_at?: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at?: Date | null;
}
