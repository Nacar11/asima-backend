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
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { RatingItemEntity } from '@/ratings/persistence/entities/rating-item.entity';

/**
 * Rating TypeORM entity.
 *
 * Customer ratings/reviews for completed bookings.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'ratings' })
@Index(['booking_id'], { unique: true })
@Index(['customer_id'])
@Index(['seller_id'])
@Index(['sales_order_id'])
@Index(['deleted_at'])
export class RatingEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  booking_id: number;

  @ManyToOne(() => BookingEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'int', nullable: false })
  sales_order_id: number;

  @ManyToOne(() => SalesOrderEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrderEntity;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  overall_rating: number;

  @Column({ type: 'text', nullable: true })
  review_comment: string | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_public: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  has_seller_response: boolean;

  @Column({ type: 'text', nullable: true })
  seller_response: string | null;

  @Column({ type: 'timestamp', nullable: true })
  seller_response_at: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Active',
    nullable: false,
  })
  status: string;

  // ==================== Relationships ====================

  @OneToMany(() => RatingItemEntity, (item) => item.rating, { eager: false })
  items: RatingItemEntity[];

  // ==================== Audit Fields ====================

  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  deleted_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by_user: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
