import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductAttributeValueEntity } from '@/product-attribute-values/persistence/entities/product-attribute-value.entity';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';

/**
 * ProductVariant TypeORM entity
 */
@Entity({
  name: 'product_variants',
})
@Index('idx_product_variants_product_id', ['product_id'])
@Index('idx_product_variants_sku', ['sku'], { unique: true })
@Index('idx_product_variants_product_id_display_order', [
  'product_id',
  'display_order',
])
export class ProductVariantEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  product_id: number;

  @Column({ name: 'sku', length: 50, unique: true })
  sku: string;

  @Column({ name: 'variant_name', length: 255 })
  variant_name: string;

  @Column({ name: 'description', length: 500, nullable: true })
  description?: string;

  @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2 })
  selling_price: number;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cost_price?: number;

  @Column({ name: 'minimum_order', default: 1 })
  minimum_order: number;

  @Column({ name: 'display_order', default: 0 })
  display_order: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  status: 'Active' | 'Inactive';

  // ==================== Shipping Dimensions ====================

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  weight_kg?: number | null;

  @Column({
    name: 'length_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  length_cm?: number | null;

  @Column({
    name: 'width_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  width_cm?: number | null;

  @Column({
    name: 'height_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  height_cm?: number | null;

  @Column({ name: 'media_id', nullable: true })
  media_id?: number;

  @ManyToOne(() => MediaEntity)
  @JoinColumn({ name: 'media_id' })
  media?: MediaEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @OneToMany(() => ProductAttributeValueEntity, (pav) => pav.product_variant)
  product_attribute_values: ProductAttributeValueEntity[];

  @OneToOne(() => InventoryStockEntity, (inventory) => inventory.variant, {
    cascade: true,
  })
  inventory_stock: InventoryStockEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date;
}
