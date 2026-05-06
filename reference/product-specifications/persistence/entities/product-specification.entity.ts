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

/**
 * ProductSpecification TypeORM entity
 */
@Entity({
  name: 'product_specifications',
})
@Index('idx_product_specifications_product_id', ['product_id'])
@Index('idx_product_specifications_specification_name', ['specification_name'])
export class ProductSpecificationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  product_id: number;

  @Column({ name: 'specification_name', length: 255 })
  specification_name: string;

  @Column({ name: 'unit', length: 50, nullable: true })
  unit: string;

  @Column({ name: 'specification_value', type: 'text' })
  specification_value: string;

  @Column({ name: 'sort_order', default: 0 })
  sort_order: number;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

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
