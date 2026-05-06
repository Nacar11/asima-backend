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
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EarningsStatusEnum } from '../../enums/earnings-status.enum';

/**
 * Seller Earning TypeORM entity.
 *
 * Represents the seller_earnings table. Tracks earnings from bookings
 * and sales orders, including platform fees and net amounts.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'seller_earnings',
})
@Index('IDX_seller_earnings_seller_id', ['seller_id'])
@Index('IDX_seller_earnings_status', ['status'])
@Index('IDX_seller_earnings_source_type', ['source_type'])
@Index('IDX_seller_earnings_available_at', ['available_at'])
@Index('IDX_seller_earnings_deleted_at', ['deleted_at'])
export class SellerEarningEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'varchar', length: 20, nullable: false })
  source_type: string; // 'booking' | 'sales_order'

  @Column({ type: 'int', nullable: false })
  source_id: number;

  @Column({ type: 'int', nullable: true })
  milestone_id: number | null;

  @ManyToOne(() => BookingMilestoneEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'milestone_id' })
  milestone: BookingMilestoneEntity | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  gross_amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  platform_fee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  net_amount: number;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: EarningsStatusEnum.PENDING,
    nullable: false,
  })
  status: EarningsStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  available_at: Date | null;

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
