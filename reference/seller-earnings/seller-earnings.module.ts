import { Module } from '@nestjs/common';
import { SellerEarningPersistenceModule } from './persistence/persistence.module';
import { SellerEarningsService } from './seller-earnings.service';
import { SellerEarningsController } from './seller-earnings.controller';

/**
 * Seller Earnings Module.
 *
 * Provides seller earnings tracking and management functionality.
 * Handles earnings from bookings and sales orders, including platform
 * fees and net amounts.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [SellerEarningPersistenceModule],
  controllers: [SellerEarningsController],
  providers: [SellerEarningsService],
  exports: [SellerEarningsService],
})
export class SellerEarningsModule {}
