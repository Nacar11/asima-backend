import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutEntity } from './entities/seller-payout.entity';
import { BaseSellerPayoutRepository } from './base-seller-payout.repository';
import { SellerPayoutRepository } from './repositories/seller-payout.repository';
import { SellerPayoutMapper } from './mappers/seller-payout.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SellerPayoutEntity])],
  providers: [
    SellerPayoutMapper,
    {
      provide: BaseSellerPayoutRepository,
      useClass: SellerPayoutRepository,
    },
  ],
  exports: [TypeOrmModule, BaseSellerPayoutRepository, SellerPayoutMapper],
})
export class SellerPayoutPersistenceModule {}
