import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * Junction table entity for products featured in sections
 * Allows a product to be featured in multiple sections simultaneously
 */
@Entity({
  name: 'product_featured_sections',
})
@Unique('uq_product_section', ['product_id', 'section'])
@Index('idx_pfs_section_order', ['section', 'display_order'])
@Index('idx_pfs_product', ['product_id'])
@Index('idx_pfs_featured_at', ['featured_at'])
export class ProductFeaturedSectionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  product_id: number;

  @ManyToOne(() => ProductEntity, (product) => product.featured_sections, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({
    type: 'enum',
    enum: FeaturedSectionEnum,
    nullable: false,
  })
  section: FeaturedSectionEnum;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'timestamp', nullable: false, default: () => 'NOW()' })
  featured_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'featured_by' })
  featured_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;
}
