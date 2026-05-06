import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { WalletTransactionMapper } from '@/wallets/persistence/mappers/wallet-transaction.mapper';
import { WalletTransaction } from '@/wallets/domain/wallet-transaction';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';

@Injectable()
export class WalletTransactionRepository {
  constructor(
    @InjectRepository(WalletTransactionEntity)
    private readonly repo: Repository<WalletTransactionEntity>,
  ) {}

  async createTransaction(
    data: Partial<WalletTransactionEntity>,
    manager: EntityManager,
  ): Promise<WalletTransaction> {
    const entity = manager.getRepository(WalletTransactionEntity).create(data);
    const saved = await manager
      .getRepository(WalletTransactionEntity)
      .save(entity);
    return WalletTransactionMapper.toDomain(saved);
  }

  async findPendingByReference(
    walletId: number,
    referenceType: string,
    referenceId: number,
    manager: EntityManager,
    transactionType?: TransactionTypeEnum,
  ): Promise<WalletTransactionEntity | null> {
    return manager.getRepository(WalletTransactionEntity).findOne({
      where: {
        wallet_id: walletId,
        reference_type: referenceType,
        reference_id: referenceId,
        status: TransactionStatusEnum.PENDING,
        ...(transactionType ? { transaction_type: transactionType } : {}),
      },
    });
  }

  async markCompleted(
    id: number,
    balanceAfter: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.getRepository(WalletTransactionEntity).update(id, {
      status: TransactionStatusEnum.COMPLETED,
      balance_after: balanceAfter,
    });
  }

  async createAdjustment(
    walletId: number,
    amount: number,
    direction: TransactionDirectionEnum,
    reason: string,
    dataSource: DataSource,
  ): Promise<void> {
    await dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(WalletEntity);
      const wallet = await walletRepo
        .createQueryBuilder('w')
        .where('w.id = :id', { id: walletId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) return;

      const currentBalance = Number(wallet.balance);
      const isCredit = direction === TransactionDirectionEnum.CREDIT;

      if (!isCredit && amount > currentBalance) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₱${currentBalance.toFixed(2)}, requested debit: ₱${amount.toFixed(2)}.`,
        );
      }

      const balanceAfter = isCredit
        ? currentBalance + amount
        : currentBalance - amount;
      const actualAmount = amount;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      await manager.query(`
        CREATE SEQUENCE IF NOT EXISTS wallet_tx_number_seq
          START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
      `);
      const seq = await manager.query(
        `SELECT nextval('wallet_tx_number_seq') AS next`,
      );
      const txNumber = `WTX-${dateStr}-${String(Number(seq[0].next)).padStart(4, '0')}`;

      const tx = manager.getRepository(WalletTransactionEntity).create({
        wallet_id: walletId,
        transaction_number: txNumber,
        transaction_type: TransactionTypeEnum.ADJUSTMENT,
        direction,
        amount: actualAmount,
        balance_before: currentBalance,
        balance_after: balanceAfter,
        status: TransactionStatusEnum.COMPLETED,
        description: reason,
      });
      await manager.getRepository(WalletTransactionEntity).save(tx);

      const updateFields: Record<string, any> = isCredit
        ? {
            balance: balanceAfter,
            total_credited: () => `total_credited + ${actualAmount}`,
          }
        : {
            balance: balanceAfter,
            total_debited: () => `total_debited + ${actualAmount}`,
          };

      await walletRepo.update(walletId, updateFields);
    });
  }

  async findByWalletId(
    walletId: number,
    filters: {
      type?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<[WalletTransaction[], number]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.wallet_id = :walletId', { walletId });

    if (filters.type) {
      qb.andWhere('t.transaction_type = :type', { type: filters.type });
    }
    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }
    if (filters.date_from) {
      qb.andWhere('t.created_at >= :from', { from: filters.date_from });
    }
    if (filters.date_to) {
      // Append end-of-day so date-only strings include the full day
      const to =
        filters.date_to.length === 10
          ? `${filters.date_to} 23:59:59`
          : filters.date_to;
      qb.andWhere('t.created_at <= :to', { to });
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('t.created_at', 'DESC');

    const [entities, count] = await qb.getManyAndCount();
    return [entities.map(WalletTransactionMapper.toDomain), count];
  }
}
