import {
  Check,
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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { WalletTypeEnum } from '@/wallets/enums/wallet-type.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

@Entity({ name: 'wallets' })
@Index(['user_id'])
@Index(['seller_id'])
@Index(['status'])
@Check(`"balance" >= 0`)
export class WalletEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({
    type: 'varchar',
    length: 10,
    default: WalletTypeEnum.SELLER,
    nullable: false,
  })
  wallet_type: WalletTypeEnum;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  pending_balance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  total_credited: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  total_debited: number;

  @Column({ type: 'varchar', length: 3, default: 'PHP', nullable: false })
  currency_code: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: WalletStatusEnum.ACTIVE,
    nullable: false,
  })
  status: WalletStatusEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  frozen_reason: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  debt_amount: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

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
  deleted_by: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
