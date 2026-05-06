import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerEarningEntity } from './entities/seller-earning.entity';
import { BaseSellerEarningRepository } from './base-seller-earning.repository';
import { SellerEarningRepository } from './repositories/seller-earning.repository';
import { SellerEarningMapper } from './mappers/seller-earning.mapper';

/**
 * Seller Earnings Persistence Module.
 *
 * Provides data access layer for seller earnings including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([SellerEarningEntity])],
  providers: [
    SellerEarningMapper,
    {
      provide: BaseSellerEarningRepository,
      useClass: SellerEarningRepository,
    },
  ],
  exports: [TypeOrmModule, BaseSellerEarningRepository, SellerEarningMapper],
})
export class SellerEarningPersistenceModule {}
