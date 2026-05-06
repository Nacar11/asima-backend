import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { NotificationsService } from '@/notifications/notifications.service';
import { PayoutsService } from '@/payouts/payouts.service';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletWithdrawalRepository } from '@/wallets/persistence/repositories/wallet-withdrawal.repository';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { WalletWithdrawalEntity } from '@/wallets/persistence/entities/wallet-withdrawal.entity';
import { WalletWithdrawal } from '@/wallets/domain/wallet-withdrawal';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

const DAILY_MAX_AMOUNT = 500_000;
const DAILY_MAX_COUNT = 3;
const MIN_WITHDRAWAL = 500;

@Injectable()
export class WalletWithdrawalService {
  private readonly logger = new Logger(WalletWithdrawalService.name);

  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: WalletTransactionRepository,
    private readonly withdrawalRepo: WalletWithdrawalRepository,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly payoutsService: PayoutsService,
    private readonly configService: ConfigService,
  ) {}

  private generateTransactionNumber(sequence: number): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `WTX-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }

  private async getNextSequence(manager: any): Promise<number> {
    await manager.query(`
      CREATE SEQUENCE IF NOT EXISTS wallet_tx_number_seq
        START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    `);
    const result = await manager.query(
      `SELECT nextval('wallet_tx_number_seq') AS next`,
    );
    return Number(result[0].next);
  }

  async requestWithdrawal(params: {
    userId: number;
    amount: number;
    bank_account_id: number;
  }): Promise<WalletWithdrawal> {
    const { userId, amount, bank_account_id } = params;

    if (amount < MIN_WITHDRAWAL) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₱${MIN_WITHDRAWAL}`,
      );
    }

    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Seller wallet not found');
    }

    if (wallet.status === WalletStatusEnum.FROZEN) {
      throw new ForbiddenException('Wallet is frozen. Contact support.');
    }

    // Quick pre-check to fail fast before acquiring a lock (not authoritative)
    if (wallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient available balance. Your available balance is ₱${wallet.balance.toFixed(2)}.`,
      );
    }

    const withdrawal = await this.dataSource.transaction(async (manager) => {
      // Re-lock wallet and re-check all limits atomically to prevent race conditions
      const lockedWallet = await this.walletRepo.findBySellerIdWithLock(
        wallet.seller_id!,
        manager,
      );
      if (!lockedWallet) throw new NotFoundException('Seller wallet not found');

      if (Number(lockedWallet.balance) < amount) {
        throw new BadRequestException(
          `Insufficient available balance. Your available balance is ₱${Number(lockedWallet.balance).toFixed(2)}.`,
        );
      }

      const [todayCount, todaySum] = await Promise.all([
        this.withdrawalRepo.countTodayByWalletId(lockedWallet.id, manager),
        this.withdrawalRepo.sumTodayByWalletId(lockedWallet.id, manager),
      ]);

      if (todayCount >= DAILY_MAX_COUNT) {
        throw new BadRequestException(
          `Daily withdrawal request limit of ${DAILY_MAX_COUNT} reached. Try again tomorrow.`,
        );
      }

      if (todaySum + amount > DAILY_MAX_AMOUNT) {
        throw new BadRequestException(
          `Daily withdrawal limit of ₱${DAILY_MAX_AMOUNT.toLocaleString()} reached. Try again tomorrow.`,
        );
      }

      const sequence = await this.getNextSequence(manager);
      const tx = await this.txRepo.createTransaction(
        {
          wallet_id: lockedWallet.id,
          transaction_number: this.generateTransactionNumber(sequence),
          transaction_type: TransactionTypeEnum.WITHDRAWAL,
          direction: TransactionDirectionEnum.DEBIT,
          amount,
          balance_before: Number(lockedWallet.balance),
          balance_after: Number(lockedWallet.balance) - amount,
          reference_type: 'withdrawal',
          status: TransactionStatusEnum.PENDING,
          description: `Withdrawal request to bank account #${bank_account_id}`,
        } as Partial<WalletTransactionEntity>,
        manager,
      );

      await manager.getRepository(WalletEntity).update(lockedWallet.id, {
        balance: () => `balance - ${amount}`,
        total_debited: () => `total_debited + ${amount}`,
      });

      return this.withdrawalRepo.create(
        {
          wallet_id: lockedWallet.id,
          wallet_transaction_id: tx.id,
          bank_account_id,
          amount,
          processing_fee: 0,
          net_amount: amount,
          status: WithdrawalStatusEnum.PENDING,
        } as Partial<WalletWithdrawalEntity>,
        manager,
      );
    });

    // Dispatch payout outside the DB transaction to avoid holding locks during external HTTP calls
    const payoutProvider =
      this.configService.get<string>('PAYOUT_PROVIDER', { infer: true }) ??
      'dragonpay';

    try {
      const payoutResult = await this.payoutsService.dispatchPayout({
        reference: withdrawal.id.toString(),
        amount,
        recipientUserId: userId,
        bankAccountId: bank_account_id,
        description: `Wallet withdrawal #${withdrawal.id}`,
      });

      const newStatus =
        payoutResult.status === 'completed'
          ? WithdrawalStatusEnum.COMPLETED
          : WithdrawalStatusEnum.PROCESSING;

      await this.withdrawalRepo.updateStatus(withdrawal.id, newStatus, {
        payout_provider: payoutProvider,
        payout_reference: payoutResult.providerTxnId,
        payout_status: payoutResult.status,
        payout_dispatched_at: new Date(),
        ...(newStatus === WithdrawalStatusEnum.COMPLETED
          ? { completed_at: new Date() }
          : {}),
      } as any);

      // Mark the linked wallet transaction as completed so it shows correctly in transaction history
      if (
        newStatus === WithdrawalStatusEnum.COMPLETED &&
        withdrawal.wallet_transaction_id
      ) {
        await this.dataSource.transaction(async (manager) => {
          const walletRow = await manager
            .getRepository(WalletEntity)
            .findOne({ where: { id: withdrawal.wallet_id } });
          await this.txRepo.markCompleted(
            withdrawal.wallet_transaction_id!,
            Number(walletRow?.balance ?? 0),
            manager,
          );
        });
      }
    } catch (payoutErr) {
      // Payout dispatch failed — reverse the debit and mark everything as FAILED
      this.logger.warn('Payout dispatch failed, reversing wallet debit', {
        withdrawalId: withdrawal.id,
        error: (payoutErr as Error).message,
      });
      await this.dataSource.transaction(async (manager) => {
        const wallet = await manager
          .getRepository(WalletEntity)
          .createQueryBuilder('w')
          .where('w.id = :id', { id: withdrawal.wallet_id })
          .setLock('pessimistic_write')
          .getOne();
        if (wallet) {
          const balanceAfter = Number(wallet.balance) + amount;
          await manager.getRepository(WalletEntity).update(wallet.id, {
            balance: () => `balance + ${amount}`,
            total_debited: () => `total_debited - ${amount}`,
          });
          if (withdrawal.wallet_transaction_id) {
            await manager
              .getRepository(WalletTransactionEntity)
              .update(withdrawal.wallet_transaction_id, {
                status: TransactionStatusEnum.FAILED,
                balance_after: balanceAfter,
              });
          }
        }
        await this.withdrawalRepo.updateStatus(
          withdrawal.id,
          WithdrawalStatusEnum.FAILED,
          { payout_provider: payoutProvider } as any,
          manager,
        );
      });
    }

    // Notify seller about the withdrawal request (fire-and-forget)
    this.notificationsService
      .sendWithdrawalRequested(userId, withdrawal.id, amount)
      .catch(() => {});

    return withdrawal;
  }

  async listByUser(userId: number): Promise<WalletWithdrawal[]> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) return [];
    const [withdrawals] = await this.withdrawalRepo.findByWalletId(
      wallet.id,
      {},
    );
    return withdrawals;
  }

  async findOneByUser(id: number, userId: number): Promise<WalletWithdrawal> {
    const withdrawal = await this.withdrawalRepo.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    const wallet = await this.walletRepo.findById(withdrawal.wallet_id);
    if (!wallet || wallet.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return withdrawal;
  }

  async markAsProcessing(id: number): Promise<void> {
    const withdrawal = await this.withdrawalRepo.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== WithdrawalStatusEnum.PENDING) {
      throw new BadRequestException(
        'Only pending withdrawals can be marked as processing',
      );
    }
    await this.withdrawalRepo.updateStatus(
      id,
      WithdrawalStatusEnum.PROCESSING,
      {
        processed_at: new Date(),
      } as any,
    );

    const wallet = await this.walletRepo.findById(withdrawal.wallet_id);
    if (wallet) {
      this.notificationsService
        .sendWithdrawalProcessing(wallet.user_id, id, withdrawal.amount)
        .catch(() => {});
    }
  }

  async markAsCompleted(
    id: number,
    bankReferenceNumber: string,
  ): Promise<void> {
    const withdrawal = await this.withdrawalRepo.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (
      ![WithdrawalStatusEnum.PENDING, WithdrawalStatusEnum.PROCESSING].includes(
        withdrawal.status,
      )
    ) {
      throw new BadRequestException(
        'Only pending or processing withdrawals can be completed',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      await this.withdrawalRepo.updateStatus(
        id,
        WithdrawalStatusEnum.COMPLETED,
        {
          bank_reference_number: bankReferenceNumber,
          completed_at: new Date(),
        } as any,
        manager,
      );

      if (withdrawal.wallet_transaction_id) {
        const walletRow = await manager
          .getRepository(WalletEntity)
          .findOne({ where: { id: withdrawal.wallet_id } });
        await this.txRepo.markCompleted(
          withdrawal.wallet_transaction_id,
          Number(walletRow?.balance ?? 0),
          manager,
        );
      }
    });

    const walletForNotif = await this.walletRepo.findById(withdrawal.wallet_id);
    if (walletForNotif) {
      this.notificationsService
        .sendWithdrawalCompleted(walletForNotif.user_id, id, withdrawal.amount)
        .catch(() => {});
    }
  }

  async markAsFailed(id: number, reason: string): Promise<void> {
    const withdrawal = await this.withdrawalRepo.findById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (
      ![WithdrawalStatusEnum.PENDING, WithdrawalStatusEnum.PROCESSING].includes(
        withdrawal.status,
      )
    ) {
      throw new BadRequestException(
        'Only pending or processing withdrawals can be failed',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      // Load wallet inside the transaction to avoid a TOCTOU gap
      const walletRow = await manager
        .getRepository(WalletEntity)
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.id = :id', { id: withdrawal.wallet_id })
        .getOne();
      if (!walletRow) return;

      await manager.getRepository(WalletEntity).update(walletRow.id, {
        balance: () => `balance + ${withdrawal.amount}`,
        total_debited: () => `total_debited - ${withdrawal.amount}`,
      });

      await this.withdrawalRepo.updateStatus(
        id,
        WithdrawalStatusEnum.FAILED,
        { failure_reason: reason } as any,
        manager,
      );
    });

    const walletForNotif = await this.walletRepo.findById(withdrawal.wallet_id);
    if (walletForNotif) {
      this.notificationsService
        .sendWithdrawalFailed(
          walletForNotif.user_id,
          id,
          withdrawal.amount,
          reason,
        )
        .catch(() => {});
    }
  }

  async findOneForAdmin(id: number) {
    const withdrawal = await this.withdrawalRepo.findOneForAdmin(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    return withdrawal;
  }

  async listAll(filters: {
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<[WalletWithdrawal[], number]> {
    return this.withdrawalRepo.findAll(filters);
  }

  async listAllWithContext(filters: {
    status?: string;
    wallet_id?: number;
    seller_name?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    const [data, total] = await this.withdrawalRepo.findAllForAdmin(filters);
    return { data, total };
  }
}
