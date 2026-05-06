import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';

@Entity({ name: 'wallet_transactions' })
@Index(['wallet_id'])
@Index(['transaction_type'])
@Index(['status'])
@Index(['created_at'])
@Index(['reference_type', 'reference_id'])
export class WalletTransactionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  wallet_id: number;

  @Column({ type: 'varchar', length: 30, nullable: false, unique: true })
  transaction_number: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  transaction_type: TransactionTypeEnum;

  @Column({ type: 'varchar', length: 6, nullable: false })
  direction: TransactionDirectionEnum;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  balance_before: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  balance_after: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  reference_type: string | null;

  @Column({ type: 'int', nullable: true })
  reference_id: number | null;

  @Column({
    type: 'varchar',
    length: 15,
    default: TransactionStatusEnum.COMPLETED,
    nullable: false,
  })
  status: TransactionStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => WalletEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  // NOTE: No updated_at / deleted_at — wallet_transactions are append-only (immutable ledger)
  @CreateDateColumn()
  created_at: Date;
}
