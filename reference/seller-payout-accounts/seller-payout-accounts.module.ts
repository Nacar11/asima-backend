import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutAccountPersistenceModule } from './persistence/persistence.module';
import { SellerPayoutAccountsService } from './seller-payout-accounts.service';
import { SellerPayoutAccountsController } from './seller-payout-accounts.controller';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Module({
  imports: [
    SellerPayoutAccountPersistenceModule,
    TypeOrmModule.forFeature([SellerEntity]),
  ],
  controllers: [SellerPayoutAccountsController],
  providers: [SellerPayoutAccountsService],
  exports: [SellerPayoutAccountsService],
})
export class SellerPayoutAccountsModule {}
