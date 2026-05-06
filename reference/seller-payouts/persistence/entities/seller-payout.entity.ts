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
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { PayoutStatusEnum } from '../../enums/payout-status.enum';

/**
 * Seller Payout TypeORM entity.
 *
 * Represents the seller_payouts table. Tracks payout requests and
 * processing for sellers.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'seller_payouts',
})
@Index('IDX_seller_payouts_seller_id', ['seller_id'])
@Index('IDX_seller_payouts_status', ['status'])
@Index('IDX_seller_payouts_payout_number', ['payout_number'], { unique: true })
@Index('IDX_seller_payouts_deleted_at', ['deleted_at'])
export class SellerPayoutEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  payout_number: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({ type: 'int', nullable: true })
  currency_id: number | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({ type: 'varchar', length: 50, nullable: false })
  payout_method: string; // 'bank_transfer' | 'gcash' | 'maya' | 'paypal'

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  account_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_name: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: PayoutStatusEnum.PENDING,
    nullable: false,
  })
  status: PayoutStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

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
