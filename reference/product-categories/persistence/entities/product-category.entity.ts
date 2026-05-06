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
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';

/**
 * ProductCategory TypeORM entity
 */
@Entity({
  name: 'product_categories',
})
@Index('idx_product_categories_product_id', ['product_id'])
@Index('idx_product_categories_category_id', ['category_id'])
@Index(
  'idx_product_categories_product_category_unique',
  ['product_id', 'category_id'],
  {
    unique: true,
  },
)
@Index('idx_product_categories_is_primary', ['is_primary'])
@Index('idx_product_categories_display_order', ['display_order'])
export class ProductCategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  product_id: number;

  @Column({ name: 'category_id' })
  category_id: number;

  @Column({ name: 'is_primary', default: false })
  is_primary: boolean;

  @Column({ name: 'display_order', default: 0 })
  display_order: number;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => CategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

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
