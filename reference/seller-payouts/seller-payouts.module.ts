import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPayoutPersistenceModule } from './persistence/persistence.module';
import { SellerPayoutsService } from './seller-payouts.service';
import { SellerPayoutsController } from './seller-payouts.controller';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SellersModule } from '@/sellers/sellers.module';

@Module({
  imports: [
    SellerPayoutPersistenceModule,
    NotificationsModule,
    SellersModule,
    TypeOrmModule.forFeature([SellerEntity]),
  ],
  controllers: [SellerPayoutsController],
  providers: [SellerPayoutsService],
  exports: [SellerPayoutsService],
})
export class SellerPayoutsModule {}
