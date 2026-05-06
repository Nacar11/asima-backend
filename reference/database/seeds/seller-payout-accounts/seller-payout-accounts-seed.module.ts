import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutAccountEntity } from '@/seller-payout-accounts/persistence/entities/seller-payout-account.entity';
import { SellerPayoutAccountsSeedService } from '@/database/seeds/seller-payout-accounts/seller-payout-accounts-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for seller payout accounts
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SellerPayoutAccountEntity,
      SellerEntity,
      UserEntity,
    ]),
  ],
  providers: [SellerPayoutAccountsSeedService],
  exports: [SellerPayoutAccountsSeedService],
})
export class SellerPayoutAccountsSeedModule {}
