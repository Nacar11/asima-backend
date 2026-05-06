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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

@Entity({ name: 'wallet_withdrawals' })
@Index(['wallet_id'])
@Index(['status'])
@Index(['requested_at'])
export class WalletWithdrawalEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  wallet_id: number;

  @Column({ type: 'int', nullable: true })
  wallet_transaction_id: number | null;

  @Column({ type: 'int', nullable: false })
  bank_account_id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  processing_fee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  net_amount: number;

  @Column({
    type: 'varchar',
    length: 15,
    default: WithdrawalStatusEnum.PENDING,
    nullable: false,
  })
  status: WithdrawalStatusEnum;

  @Column({ type: 'varchar', length: 500, nullable: true })
  failure_reason: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_reference_number: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  payout_provider: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  payout_reference: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payout_status: string | null;

  @Column({ type: 'timestamp', nullable: true })
  payout_dispatched_at: Date | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  requested_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', nullable: true })
  processed_by_id: number | null;

  @ManyToOne(() => WalletEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @ManyToOne(() => WalletTransactionEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'wallet_transaction_id' })
  wallet_transaction: WalletTransactionEntity | null;

  @ManyToOne(() => BankAccountEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'bank_account_id' })
  bank_account: BankAccountEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'processed_by_id' })
  processed_by: UserEntity | null;

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
