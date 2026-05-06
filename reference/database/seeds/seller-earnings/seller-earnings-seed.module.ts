import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerEarningEntity } from '@/seller-earnings/persistence/entities/seller-earning.entity';
import { SellerEarningsSeedService } from '@/database/seeds/seller-earnings/seller-earnings-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Seed module for seller earnings
 */
@Module({
  imports: [TypeOrmModule.forFeature([SellerEarningEntity, SellerEntity])],
  providers: [SellerEarningsSeedService],
  exports: [SellerEarningsSeedService],
})
export class SellerEarningsSeedModule {}
