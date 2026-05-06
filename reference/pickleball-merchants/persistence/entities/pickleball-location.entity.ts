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
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';

@Entity({ name: 'pickleball_locations' })
@Index(['key'], { unique: true })
@Index(['seller_id'], { unique: true })
@Index(['application_id'], { unique: true })
@Index(['status'])
@Index(['display_order'])
export class PickleballLocationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  key: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barangay: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: false,
    default: 'independent_merchant',
  })
  source_type: string;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: true })
  application_id: number | null;

  @ManyToOne(() => PickleballMerchantApplicationEntity, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'application_id' })
  application: PickleballMerchantApplicationEntity | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  background_image_url: string | null;

  @Column({ type: 'varchar', length: 32, nullable: false, default: 'active' })
  status: string;

  @Column({ type: 'int', nullable: false, default: 100 })
  display_order: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
