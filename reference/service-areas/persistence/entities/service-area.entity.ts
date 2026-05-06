import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';

@Entity({ name: 'service_areas' })
@Index(['seller_id'])
@Index(['service_id'])
@Index(['city', 'province'])
@Index(['postal_code'])
@Index(['status'])
export class ServiceAreaEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Seller who owns this service area.
   * NEW: Primary reference for seller-level service areas.
   */
  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  /**
   * @deprecated Service-level areas are deprecated. Use seller_id instead.
   * Kept for backward compatibility during migration.
   */
  @Column({ type: 'int', nullable: true })
  service_id: number | null;

  @ManyToOne(() => ServiceEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barangay: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  center_latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  center_longitude: number | null;

  @Column({ type: 'int', nullable: true })
  radius_km: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  additional_fee: number;

  @Column({
    type: 'enum',
    enum: AdditionalFeeTypeEnum,
    default: AdditionalFeeTypeEnum.FIXED,
    nullable: false,
  })
  additional_fee_type: AdditionalFeeTypeEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_order_amount: number | null;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
