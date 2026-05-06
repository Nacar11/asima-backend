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
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

@Entity({ name: 'seller_members' })
@Index(['seller_id', 'user_id'], { unique: true })
@Index(['status'])
@Index(['is_available_for_booking'])
export class SellerMemberEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50, default: 'member', nullable: false })
  role: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_service_provider: boolean;

  @Column({ type: 'int', default: 8, nullable: false })
  max_daily_bookings: number;

  @Column({ type: 'int', default: 1, nullable: false })
  max_concurrent_bookings: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 8,
    nullable: false,
  })
  service_capacity_hours: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_available_for_booking: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  display_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_image_url: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    nullable: false,
  })
  average_rating: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_reviews: number;

  @Column({ type: 'int', default: 0, nullable: false })
  total_completed_bookings: number;

  @Column({
    type: 'enum',
    enum: SellerMemberStatusEnum,
    default: SellerMemberStatusEnum.ACTIVE,
    nullable: false,
  })
  status: SellerMemberStatusEnum;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
