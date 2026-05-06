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
import { Exclude } from 'class-transformer';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductSpecificationEntity } from '@/product-specifications/persistence/entities/product-specification.entity';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { ProductFeaturedSectionEntity } from '@/featured-products/persistence/entities/product-featured-section.entity';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';

/**
 * Product TypeORM entity
 */
@Entity({
  name: 'products',
})
@Index(['product_name'])
@Index(['deleted_at'])
export class ProductEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  product_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'Published',
  })
  status: string;

  /**
   * Listing type: product (marketplace visible) or material (internal for quotations).
   */
  @Column({
    type: 'enum',
    enum: ListingTypeEnum,
    default: ListingTypeEnum.PRODUCT,
    nullable: false,
  })
  listing_type: ListingTypeEnum;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @Exclude()
  @ManyToOne(() => SellerEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @OneToMany(
    () => ProductCategoryEntity,
    (productCategory) => productCategory.product,
    { eager: false, nullable: true },
  )
  product_categories: ProductCategoryEntity[] | null;

  @OneToMany(
    () => ProductAttributeEntity,
    (productAttribute) => productAttribute.product,
    { eager: false, nullable: true },
  )
  product_attributes: ProductAttributeEntity[] | null;

  @OneToMany(
    () => ProductVariantEntity,
    (productVariant) => productVariant.product,
    { eager: false, nullable: true },
  )
  product_variants: ProductVariantEntity[] | null;

  @OneToMany(
    () => ProductSpecificationEntity,
    (productSpecification) => productSpecification.product,
    { eager: false, nullable: true },
  )
  product_specifications: ProductSpecificationEntity[] | null;

  @OneToMany(() => ProductTagEntity, (productTag) => productTag.product, {
    eager: false,
    nullable: true,
  })
  product_tags: ProductTagEntity[] | null;

  @OneToMany(
    () => ProductMediaMappingEntity,
    (mediaMapping) => mediaMapping.product,
    {
      eager: false,
      nullable: true,
    },
  )
  product_media_mappings: ProductMediaMappingEntity[] | null;

  // Featured sections relationship (many-to-many via junction table)
  @OneToMany(
    () => ProductFeaturedSectionEntity,
    (featuredSection) => featuredSection.product,
    {
      eager: false,
      nullable: true,
    },
  )
  featured_sections: ProductFeaturedSectionEntity[] | null;

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
