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
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';

@Entity({ name: 'reviews' })
@Index(['product_id'])
@Index(['seller_id'])
@Index(['user_id'])
@Index(['rating'])
@Index(['is_verified_purchase'])
@Index(['created_at'])
@Index(['reviewable_type'])
@Index(['source_type'])
@Index(['source_id'])
@Index(['service_id'])
@Index(['booking_id'])
export class ReviewEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  seller_id: number;

  @Column({ nullable: true })
  product_id?: number;

  @Column({ nullable: true })
  sales_order_item_id?: number;

  @ManyToOne(() => SalesOrderItemEntity, { nullable: true })
  @JoinColumn({ name: 'sales_order_item_id' })
  sales_order_item?: SalesOrderItemEntity | null;

  @Column({
    type: 'enum',
    enum: ReviewableTypeEnum,
    default: ReviewableTypeEnum.PRODUCT,
  })
  reviewable_type: ReviewableTypeEnum;

  @Column({
    type: 'enum',
    enum: ReviewSourceTypeEnum,
    nullable: true,
  })
  source_type?: ReviewSourceTypeEnum;

  @Column({ nullable: true })
  source_id?: number;

  @Column({ nullable: true })
  service_id?: number;

  @Column({ nullable: true })
  booking_id?: number;

  @Column({ type: 'jsonb', nullable: true })
  aspect_ratings?: {
    punctuality?: number;
    quality?: number;
    communication?: number;
    professionalism?: number;
  };

  @Column()
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ default: false })
  is_anonymous: boolean;

  @Column({ default: false })
  is_verified_purchase: boolean;

  @Column({
    type: 'enum',
    enum: ['Active', 'Removed'],
    default: 'Active',
  })
  status: 'Active' | 'Removed';

  @Column({ type: 'text', nullable: true })
  reply_text?: string;

  @Column({ type: 'timestamp', nullable: true })
  reply_at?: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by?: UserEntity | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by?: UserEntity | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToOne(() => SellerEntity, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerEntity;

  @ManyToOne(() => ProductEntity, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;

  @ManyToOne(() => ServiceEntity, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: BookingEntity;

  @OneToMany(() => ReviewMediaMappingEntity, (mapping) => mapping.review)
  review_media_mappings?: ReviewMediaMappingEntity[];
}
