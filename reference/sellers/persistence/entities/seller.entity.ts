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
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BusinessTypeEnum } from '@/sellers/enums/business-type.enum';

/**
 * Seller TypeORM entity
 * Seller-specific details separated from user profile
 * Enables seller analytics, verification, and commission tracking
 */
@Entity({
  name: 'sellers',
})
@Index(['user_id'], { unique: true })
@Index(['store_name'])
@Index(['is_verified'])
@Index(['is_active'])
@Index(['is_featured'])
@Index(['status'])
@Index(['slug'], { unique: true })
export class SellerEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true, nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  store_name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  store_description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  store_logo_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  store_banner_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_registration_number: string | null;

  @Column({
    type: 'enum',
    enum: BusinessTypeEnum,
    nullable: true,
  })
  business_type: BusinessTypeEnum | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tax_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_account_holder: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bank_account_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_verified: boolean;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: true, nullable: false })
  sells_products: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  sells_services: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_featured: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  auto_accept_bookings: boolean;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'int', nullable: true })
  years_of_experience: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  hourly_rate: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  commission_rate: number; // Platform commission % deducted before crediting seller wallet

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    nullable: false,
  })
  total_sales: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_reviews: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    nullable: false,
  })
  average_rating: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_services: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_completed_bookings: number;

  // ==================== Booking Capacity Settings ====================

  @Column({ type: 'int', default: 1, nullable: false })
  max_concurrent_bookings: number;

  @Column({ type: 'int', default: 8, nullable: false })
  max_daily_bookings: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 8,
    nullable: false,
  })
  service_capacity_hours: number;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
    nullable: false,
  })
  status: StatusEnum;

  @Column({ type: 'int', nullable: true })
  edistrict_id: number | null;

  @ManyToOne(() => EdistrictEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'edistrict_id' })
  edistrict: EdistrictEntity | null;

  @OneToMany(() => CategoryEntity, (category) => category.seller, {
    eager: false,
    nullable: true,
  })
  categories: CategoryEntity[] | null;

  // ==================== Pickup Location for Shipping ====================

  @Column({ type: 'varchar', length: 255, nullable: true })
  pickup_address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pickup_city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pickup_province: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pickup_postal_code: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  pickup_latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  pickup_longitude: number | null;

  // ==================== Service Location for Walk-in Appointments ====================

  @Column({ type: 'int', nullable: true })
  service_location_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'service_location_address_id' })
  service_location_address: UserAddressEntity | null;

  // ==================== Pickup Configuration ====================

  @Column({ type: 'boolean', default: false, nullable: false })
  pickup_enabled: boolean;

  @Column({ type: 'int', nullable: true })
  pickup_address_id: number | null;

  @ManyToOne(() => UserAddressEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'pickup_address_id' })
  pickup_address_entity: UserAddressEntity | null;

  @Column({ type: 'int', default: 30, nullable: false })
  pickup_preparation_time: number;

  @Column({ type: 'int', default: 10, nullable: false })
  pickup_max_concurrent_orders: number;

  @Column({ type: 'text', nullable: true })
  pickup_instructions: string | null;

  @Column({ type: 'int', default: 120, nullable: false })
  pickup_grace_period: number;

  // ==================== End Pickup Configuration ====================

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
