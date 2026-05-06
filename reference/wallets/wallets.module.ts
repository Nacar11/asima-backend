import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsModule } from '@/payouts/payouts.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { WalletWithdrawalEntity } from '@/wallets/persistence/entities/wallet-withdrawal.entity';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletWithdrawalRepository } from '@/wallets/persistence/repositories/wallet-withdrawal.repository';
import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';
import { WalletWithdrawalService } from '@/wallets/services/wallet-withdrawal.service';
import { WalletsService } from '@/wallets/wallets.service';
import { SellerGuard } from '@/users/user.guard';
import { SellerWalletsController } from '@/wallets/controllers/seller-wallets.controller';
import { AdminWalletsController } from '@/wallets/controllers/admin-wallets.controller';
import { AdminWalletWithdrawalsController } from '@/wallets/controllers/admin-wallet-withdrawals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      WalletTransactionEntity,
      WalletWithdrawalEntity,
    ]),
    PayoutsModule,
    NotificationsModule,
  ],
  controllers: [
    SellerWalletsController,
    AdminWalletsController,
    AdminWalletWithdrawalsController,
  ],
  providers: [
    WalletsService,
    WalletTransactionService,
    WalletWithdrawalService,
    WalletRepository,
    WalletTransactionRepository,
    WalletWithdrawalRepository,
    SellerGuard,
  ],
  exports: [WalletsService],
})
export class WalletsModule {}
