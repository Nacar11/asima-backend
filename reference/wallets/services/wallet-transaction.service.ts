import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class WalletTransactionService {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: WalletTransactionRepository,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateTransactionNumber(sequence: number): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `WTX-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }

  private calculateCommission(
    grossAmount: number,
    ratePercent: number,
  ): number {
    return Math.round(grossAmount * (ratePercent / 100) * 100) / 100;
  }

  private async getNextSequence(manager: EntityManager): Promise<number> {
    const result = await manager.query(
      `SELECT nextval('wallet_tx_number_seq') AS next`,
    );
    return Number(result[0].next);
  }

  /**
   * Credit pending earning when order is placed/accepted.
   * Increases pending_balance only. Balance unchanged until order completes.
   */
  async creditPendingEarning(params: {
    sellerId: number;
    salesOrderId: number;
    grossAmount: number;
    commissionRate: number;
  }): Promise<void> {
    const { sellerId, salesOrderId, grossAmount, commissionRate } = params;
    const commission = this.calculateCommission(grossAmount, commissionRate);
    const netAmount = grossAmount - commission;

    // Auto-create wallet if seller doesn't have one yet
    const sellerRow = await this.dataSource
      .getRepository('sellers')
      .createQueryBuilder('s')
      .select('s.user_id')
      .where('s.id = :sellerId', { sellerId })
      .getRawOne<{ s_user_id: number }>();

    if (sellerRow?.s_user_id) {
      await this.walletRepo.createIfNotExists(sellerRow.s_user_id, sellerId);
    }

    await this.dataSource.transaction(async (manager) => {
      const wallet = await this.walletRepo.findBySellerIdWithLock(
        sellerId,
        manager,
      );
      if (!wallet) {
        throw new BadRequestException(
          `Seller wallet not found for seller ${sellerId}`,
        );
      }

      // Idempotency guard: if an EARNING transaction already exists for this order
      // (PENDING = credited but order not yet completed; COMPLETED = already confirmed),
      // a duplicate webhook or retry is calling us — skip silently.
      const existingEarning = await manager
        .getRepository(WalletTransactionEntity)
        .findOne({
          where: [
            {
              wallet_id: wallet.id,
              reference_type: 'sales_order',
              reference_id: salesOrderId,
              transaction_type: TransactionTypeEnum.EARNING,
              status: TransactionStatusEnum.PENDING,
            },
            {
              wallet_id: wallet.id,
              reference_type: 'sales_order',
              reference_id: salesOrderId,
              transaction_type: TransactionTypeEnum.EARNING,
              status: TransactionStatusEnum.COMPLETED,
            },
          ],
        });
      if (existingEarning) return;

      const sequence = await this.getNextSequence(manager);
      await this.txRepo.createTransaction(
        {
          wallet_id: wallet.id,
          transaction_number: this.generateTransactionNumber(sequence),
          transaction_type: TransactionTypeEnum.EARNING,
          direction: TransactionDirectionEnum.CREDIT,
          amount: netAmount,
          balance_before: Number(wallet.balance),
          balance_after: Number(wallet.balance),
          description: `Pending earnings from Order #${salesOrderId} (₱${grossAmount} - ₱${commission} commission)`,
          reference_type: 'sales_order',
          reference_id: salesOrderId,
          status: TransactionStatusEnum.PENDING,
        } as Partial<WalletTransactionEntity>,
        manager,
      );

      await manager.getRepository(WalletEntity).update(wallet.id, {
        pending_balance: () => `pending_balance + ${netAmount}`,
      });

      // Credit platform wallet with full gross amount (payment received from customer)
      const platformWallet =
        await this.walletRepo.findAdminWalletWithLock(manager);
      if (platformWallet) {
        const seq2 = await this.getNextSequence(manager);
        await this.txRepo.createTransaction(
          {
            wallet_id: platformWallet.id,
            transaction_number: this.generateTransactionNumber(seq2),
            transaction_type: TransactionTypeEnum.PLATFORM_RECEIVE,
            direction: TransactionDirectionEnum.CREDIT,
            amount: grossAmount,
            balance_before: Number(platformWallet.balance),
            balance_after: Number(platformWallet.balance),
            description: `Payment received for Order #${salesOrderId}`,
            reference_type: 'sales_order',
            reference_id: salesOrderId,
            status: TransactionStatusEnum.PENDING,
          } as Partial<WalletTransactionEntity>,
          manager,
        );
        await manager.getRepository(WalletEntity).update(platformWallet.id, {
          pending_balance: () => `pending_balance + ${grossAmount}`,
        });
      }
    });
  }

  /**
   * Move earning from pending to available when order reaches COMPLETED status.
   */
  async confirmEarning(params: {
    sellerId: number;
    salesOrderId: number;
  }): Promise<void> {
    const { sellerId, salesOrderId } = params;
    let creditedAmount = 0;
    let sellerUserId: number | null = null;

    await this.dataSource.transaction(async (manager) => {
      const wallet = await this.walletRepo.findBySellerIdWithLock(
        sellerId,
        manager,
      );
      if (!wallet) return;

      const pendingTx = await this.txRepo.findPendingByReference(
        wallet.id,
        'sales_order',
        salesOrderId,
        manager,
      );
      if (!pendingTx) return;

      const netAmount = Number(pendingTx.amount);
      const debtOffset = Math.min(Number(wallet.debt_amount ?? 0), netAmount);
      const netCredit = netAmount - debtOffset;
      const newBalance = Number(wallet.balance) + netCredit;

      creditedAmount = netCredit;
      sellerUserId = wallet.user_id ?? null;

      await this.txRepo.markCompleted(pendingTx.id, newBalance, manager);

      const walletUpdates: Record<string, any> = {
        balance: () => `balance + ${netCredit}`,
        pending_balance: () => `pending_balance - ${netAmount}`,
        total_credited: () => `total_credited + ${netCredit}`,
      };
      if (debtOffset > 0) {
        walletUpdates.debt_amount = () => `debt_amount - ${debtOffset}`;
      }
      await manager
        .getRepository(WalletEntity)
        .update(wallet.id, walletUpdates);

      // Update platform wallet: move gross from pending→balance, record disbursement + commission
      const platformWallet =
        await this.walletRepo.findAdminWalletWithLock(manager);
      if (platformWallet) {
        // Find the pending PLATFORM_RECEIVE transaction for this order
        const platformPendingTx = await this.txRepo.findPendingByReference(
          platformWallet.id,
          'sales_order',
          salesOrderId,
          manager,
        );
        const grossAmount = platformPendingTx
          ? Number(platformPendingTx.amount)
          : netAmount;
        const commissionAmount = grossAmount - netAmount;
        const platformBalanceBefore = Number(platformWallet.balance);
        const platformBalanceAfterReceive = platformBalanceBefore + grossAmount;

        if (platformPendingTx) {
          await this.txRepo.markCompleted(
            platformPendingTx.id,
            platformBalanceAfterReceive,
            manager,
          );
        }

        // Disbursement to seller
        const seq1 = await this.getNextSequence(manager);
        await this.txRepo.createTransaction(
          {
            wallet_id: platformWallet.id,
            transaction_number: this.generateTransactionNumber(seq1),
            transaction_type: TransactionTypeEnum.DISBURSEMENT,
            direction: TransactionDirectionEnum.DEBIT,
            amount: netAmount,
            balance_before: platformBalanceAfterReceive,
            balance_after: platformBalanceAfterReceive - netAmount,
            description: `Seller disbursement for Order #${salesOrderId}`,
            reference_type: 'sales_order',
            reference_id: salesOrderId,
            status: TransactionStatusEnum.COMPLETED,
          } as Partial<WalletTransactionEntity>,
          manager,
        );

        // Commission retained by platform
        if (commissionAmount > 0) {
          const seq2 = await this.getNextSequence(manager);
          await this.txRepo.createTransaction(
            {
              wallet_id: platformWallet.id,
              transaction_number: this.generateTransactionNumber(seq2),
              transaction_type: TransactionTypeEnum.COMMISSION_EARNED,
              direction: TransactionDirectionEnum.CREDIT,
              amount: commissionAmount,
              balance_before: platformBalanceAfterReceive - netAmount,
              balance_after:
                platformBalanceAfterReceive - netAmount + commissionAmount,
              description: `Commission earned from Order #${salesOrderId}`,
              reference_type: 'sales_order',
              reference_id: salesOrderId,
              status: TransactionStatusEnum.COMPLETED,
            } as Partial<WalletTransactionEntity>,
            manager,
          );
        }

        if (!Number.isFinite(grossAmount) || !Number.isFinite(netAmount)) {
          throw new Error(
            `Invalid commission amounts: grossAmount=${grossAmount}, netAmount=${netAmount}`,
          );
        }
        const gross = Math.round(Number(grossAmount) * 100) / 100;
        const net = Math.round(Number(netAmount) * 100) / 100;
        await manager.getRepository(WalletEntity).update(platformWallet.id, {
          balance: () => `balance + ${gross} - ${net}`,
          pending_balance: () => `pending_balance - ${gross}`,
          total_credited: () => `total_credited + ${gross}`,
          total_debited: () => `total_debited + ${net}`,
        });
      }
    });

    if (sellerUserId && creditedAmount > 0) {
      this.notificationsService
        .sendEarningsCredited(sellerUserId, salesOrderId, creditedAmount)
        .catch(() => {
          // Non-critical — do not fail the earnings confirmation
        });
    }
  }

  /**
   * Deduct return amount from seller wallet.
   * If balance insufficient, record shortfall as debt_amount on wallet.
   */
  async deductReturn(params: {
    sellerId: number;
    returnRequestId: number;
    amount: number;
  }): Promise<void> {
    const { sellerId, returnRequestId, amount } = params;

    // Auto-create wallet if seller doesn't have one yet
    const sellerRowForReturn = await this.dataSource
      .getRepository('sellers')
      .createQueryBuilder('s')
      .select('s.user_id')
      .where('s.id = :sellerId', { sellerId })
      .getRawOne<{ s_user_id: number }>();

    if (sellerRowForReturn?.s_user_id) {
      await this.walletRepo.createIfNotExists(
        sellerRowForReturn.s_user_id,
        sellerId,
      );
    }

    let deductedShortfall = 0;

    await this.dataSource.transaction(async (manager) => {
      const wallet = await this.walletRepo.findBySellerIdWithLock(
        sellerId,
        manager,
      );
      if (!wallet) return;

      const available = Number(wallet.balance);
      const deductable = Math.min(available, amount);
      const shortfall = amount - deductable;
      deductedShortfall = shortfall;

      if (deductable > 0) {
        const sequence = await this.getNextSequence(manager);
        await this.txRepo.createTransaction(
          {
            wallet_id: wallet.id,
            transaction_number: this.generateTransactionNumber(sequence),
            transaction_type: TransactionTypeEnum.RETURN_DEDUCTION,
            direction: TransactionDirectionEnum.DEBIT,
            amount: deductable,
            balance_before: available,
            balance_after: available - deductable,
            reference_type: 'return_request',
            reference_id: returnRequestId,
            status: TransactionStatusEnum.COMPLETED,
            description: `Return deduction for return request #${returnRequestId}`,
          } as Partial<WalletTransactionEntity>,
          manager,
        );
      }

      const updates: Record<string, any> = {
        balance: () => `balance - ${deductable}`,
        total_debited: () => `total_debited + ${deductable}`,
      };

      if (shortfall > 0) {
        updates.debt_amount = () => `debt_amount + ${shortfall}`;
        const seq2 = await this.getNextSequence(manager);
        await this.txRepo.createTransaction(
          {
            wallet_id: wallet.id,
            transaction_number: this.generateTransactionNumber(seq2),
            transaction_type: TransactionTypeEnum.RETURN_DEDUCTION,
            direction: TransactionDirectionEnum.DEBIT,
            amount: shortfall,
            balance_before: 0,
            balance_after: 0,
            reference_type: 'return_request',
            reference_id: returnRequestId,
            status: TransactionStatusEnum.PENDING,
            description: `Return shortfall pending recovery for return request #${returnRequestId}`,
          } as Partial<WalletTransactionEntity>,
          manager,
        );
      }

      await manager.getRepository(WalletEntity).update(wallet.id, updates);

      // Debit platform wallet for the refund paid out to customer
      const platformWallet =
        await this.walletRepo.findAdminWalletWithLock(manager);
      if (platformWallet) {
        const platformBalance = Number(platformWallet.balance);
        const seq = await this.getNextSequence(manager);
        await this.txRepo.createTransaction(
          {
            wallet_id: platformWallet.id,
            transaction_number: this.generateTransactionNumber(seq),
            transaction_type: TransactionTypeEnum.REFUND_PAID,
            direction: TransactionDirectionEnum.DEBIT,
            amount: amount,
            balance_before: platformBalance,
            balance_after: Math.max(0, platformBalance - amount),
            description: `Refund paid for return request #${returnRequestId}`,
            reference_type: 'return_request',
            reference_id: returnRequestId,
            status: TransactionStatusEnum.COMPLETED,
          } as Partial<WalletTransactionEntity>,
          manager,
        );
        await manager.getRepository(WalletEntity).update(platformWallet.id, {
          balance: () => `GREATEST(balance - ${amount}, 0)`,
          total_debited: () => `total_debited + ${amount}`,
        });
      }
    });

    // Send notifications to seller (fire-and-forget)
    const sellerUserId = sellerRowForReturn?.s_user_id;
    if (sellerUserId) {
      this.notificationsService
        .sendReturnDeduction(sellerUserId, returnRequestId, amount)
        .catch(() => {});

      if (deductedShortfall > 0) {
        this.notificationsService
          .sendDebtFlagged(sellerUserId, returnRequestId, deductedShortfall)
          .catch(() => {});
      }
    }
  }
}
