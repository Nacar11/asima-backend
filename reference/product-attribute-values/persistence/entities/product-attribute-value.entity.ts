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
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';

/**
 * Product Attribute Value TypeORM entity
 */
@Entity({
  name: 'product_attribute_values',
})
@Index('idx_product_attribute_values_product_variant_id', [
  'product_variant_id',
])
@Index('idx_product_attribute_values_product_attribute_id', [
  'product_attribute_id',
])
@Index('idx_product_attribute_values_attribute_value_id', [
  'attribute_value_id',
])
export class ProductAttributeValueEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_variant_id' })
  product_variant_id: number;

  @ManyToOne(() => ProductVariantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariantEntity;

  @Column({ name: 'product_attribute_id' })
  product_attribute_id: number;

  @ManyToOne(() => ProductAttributeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_attribute_id' })
  product_attribute: ProductAttributeEntity;

  @Column({ name: 'attribute_value_id' })
  attribute_value_id: number;

  @ManyToOne(() => AttributeValueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attribute_value_id' })
  attribute_value: AttributeValueEntity;

  @Column({ name: 'is_default', default: false })
  is_default: boolean;

  @Column({ name: 'created_by', nullable: true })
  created_by: number;

  @Column({ name: 'updated_by', nullable: true })
  updated_by: number;

  @Column({ name: 'deleted_by', nullable: true })
  deleted_by: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date;
}
