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
import { PayoutAccountTypeEnum } from '../../enums/payout-account-type.enum';

/**
 * Seller Payout Account TypeORM entity.
 *
 * Represents the seller_payout_accounts table. Stores payout account
 * information for sellers (bank accounts, e-wallets, etc.).
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'seller_payout_accounts',
})
@Index('IDX_seller_payout_accounts_seller_id', ['seller_id'])
@Index('IDX_seller_payout_accounts_is_default', ['is_default'])
@Index('IDX_seller_payout_accounts_status', ['status'])
@Index('IDX_seller_payout_accounts_deleted_at', ['deleted_at'])
export class SellerPayoutAccountEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({
    type: 'enum',
    enum: PayoutAccountTypeEnum,
    nullable: false,
  })
  account_type: PayoutAccountTypeEnum;

  @Column({ type: 'varchar', length: 255, nullable: false })
  account_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  account_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bank_code: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_branch: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  swift_code: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile_number: string | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_default: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'active' })
  status: string; // 'active' | 'inactive' | 'suspended'

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
