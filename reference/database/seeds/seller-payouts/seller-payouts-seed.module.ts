import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutEntity } from '@/seller-payouts/persistence/entities/seller-payout.entity';
import { SellerPayoutsSeedService } from '@/database/seeds/seller-payouts/seller-payouts-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Seed module for seller payouts
 */
@Module({
  imports: [TypeOrmModule.forFeature([SellerPayoutEntity, SellerEntity])],
  providers: [SellerPayoutsSeedService],
  exports: [SellerPayoutsSeedService],
})
export class SellerPayoutsSeedModule {}
