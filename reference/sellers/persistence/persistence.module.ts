import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { SellerRepository } from '@/sellers/persistence/repositories/seller.repository';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';

/**
 * Persistence module for sellers
 * Encapsulates TypeORM setup and repository configuration
 */
@Module({
  imports: [TypeOrmModule.forFeature([SellerEntity])],
  providers: [
    SellerMapper,
    {
      provide: BaseSellerRepository,
      useClass: SellerRepository,
    },
  ],
  exports: [TypeOrmModule, BaseSellerRepository, SellerMapper],
})
export class SellerPersistenceModule {}
