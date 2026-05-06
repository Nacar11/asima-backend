import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutAccountEntity } from './entities/seller-payout-account.entity';
import { BaseSellerPayoutAccountRepository } from './base-seller-payout-account.repository';
import { SellerPayoutAccountRepository } from './repositories/seller-payout-account.repository';
import { SellerPayoutAccountMapper } from './mappers/seller-payout-account.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SellerPayoutAccountEntity])],
  providers: [
    SellerPayoutAccountMapper,
    {
      provide: BaseSellerPayoutAccountRepository,
      useClass: SellerPayoutAccountRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseSellerPayoutAccountRepository,
    SellerPayoutAccountMapper,
  ],
})
export class SellerPayoutAccountPersistenceModule {}
