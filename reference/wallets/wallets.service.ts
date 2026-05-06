import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';
import { WalletWithdrawalService } from '@/wallets/services/wallet-withdrawal.service';
import { Wallet } from '@/wallets/domain/wallet';
import { AdminWalletListItem } from '@/wallets/domain/admin-wallet-list-item';
import { WalletWithdrawal } from '@/wallets/domain/wallet-withdrawal';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';

@Injectable()
export class WalletsService {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: WalletTransactionRepository,
    private readonly txService: WalletTransactionService,
    private readonly withdrawalService: WalletWithdrawalService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async creditPendingEarning(
    sellerId: number,
    salesOrderId: number,
    grossAmount: number,
    commissionRate: number,
  ): Promise<void> {
    return this.txService.creditPendingEarning({
      sellerId,
      salesOrderId,
      grossAmount,
      commissionRate,
    });
  }

  async confirmEarning(sellerId: number, salesOrderId: number): Promise<void> {
    return this.txService.confirmEarning({ sellerId, salesOrderId });
  }

  async deductReturn(
    sellerId: number,
    returnRequestId: number,
    amount: number,
  ): Promise<void> {
    return this.txService.deductReturn({ sellerId, returnRequestId, amount });
  }

  async getSellerWallet(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      // Auto-create wallet for sellers who registered before the wallet system existed
      const sellerRow = await this.dataSource
        .getRepository('sellers')
        .createQueryBuilder('s')
        .select(['s.id'])
        .where('s.user_id = :userId', { userId })
        .getRawOne<{ s_id: number }>();

      if (!sellerRow) throw new NotFoundException('Seller wallet not found');

      await this.walletRepo.createIfNotExists(userId, sellerRow.s_id);
      wallet = await this.walletRepo.findByUserId(userId);
      if (!wallet) throw new NotFoundException('Seller wallet not found');
    }
    return wallet;
  }

  async ensureSellerWallet(userId: number, sellerId: number): Promise<void> {
    await this.walletRepo.createIfNotExists(userId, sellerId);
  }

  async requestWithdrawal(
    userId: number,
    amount: number,
    bankAccountId: number,
  ): Promise<WalletWithdrawal> {
    return this.withdrawalService.requestWithdrawal({
      userId,
      amount,
      bank_account_id: bankAccountId,
    });
  }

  async listWithdrawals(userId: number): Promise<WalletWithdrawal[]> {
    return this.withdrawalService.listByUser(userId);
  }

  async getWithdrawal(id: number, userId: number): Promise<WalletWithdrawal> {
    return this.withdrawalService.findOneByUser(id, userId);
  }

  async getTransactions(
    userId: number,
    filters: {
      type?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) return [[], 0];
    return this.txRepo.findByWalletId(wallet.id, filters);
  }

  async adminListWallets(filters: {
    status?: string;
    seller_id?: number;
    seller_name?: string;
    page?: number;
    limit?: number;
  }) {
    return this.walletRepo.findAll(filters);
  }

  async adminGetWallet(id: number): Promise<Wallet> {
    const wallet = await this.walletRepo.findById(id);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async adminFreezeWallet(id: number, reason: string): Promise<void> {
    await this.walletRepo.updateStatus(id, WalletStatusEnum.FROZEN, reason);
  }

  async adminUnfreezeWallet(id: number): Promise<void> {
    await this.walletRepo.updateStatus(id, WalletStatusEnum.ACTIVE, null);
  }

  async adminAdjustWallet(
    id: number,
    amount: number,
    direction: TransactionDirectionEnum,
    reason: string,
  ): Promise<void> {
    await this.txRepo.createAdjustment(
      id,
      amount,
      direction,
      reason,
      this.dataSource,
    );
  }

  async getPlatformWallet(): Promise<Wallet> {
    const wallet = await this.walletRepo.findAdminWallet();
    if (!wallet) throw new NotFoundException('Platform wallet not found');
    return wallet;
  }

  async adminListWalletsWithContext(filters: {
    status?: string;
    seller_name?: string;
    page?: number;
    limit?: number;
  }): Promise<[AdminWalletListItem[], number]> {
    return this.walletRepo.findAllForAdmin(filters);
  }

  async adminGetWalletWithContext(id: number): Promise<AdminWalletListItem> {
    const wallet = await this.walletRepo.findByIdForAdmin(id);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async adminGetWalletTransactions(
    walletId: number,
    filters: {
      type?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.txRepo.findByWalletId(wallet.id, filters);
  }

  async getPlatformWalletTransactions(filters: {
    type?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    const wallet = await this.walletRepo.findAdminWallet();
    if (!wallet) return [[], 0];
    return this.txRepo.findByWalletId(wallet.id, filters);
  }
}
