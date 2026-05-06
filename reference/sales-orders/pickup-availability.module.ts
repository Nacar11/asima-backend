import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PickupAvailabilityService } from './pickup-availability.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrderEntity } from './persistence/entities/sales-order.entity';
import { SellerPersistenceModule } from '@/sellers/persistence/persistence.module';
import { SellerSchedulesPersistenceModule } from '@/seller-schedules/persistence/persistence.module';
import { StoreUnavailabilityPersistenceModule } from '@/store-unavailability/persistence/persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SellerEntity, SalesOrderEntity]),
    SellerPersistenceModule,
    SellerSchedulesPersistenceModule,
    StoreUnavailabilityPersistenceModule,
  ],
  providers: [PickupAvailabilityService],
  exports: [PickupAvailabilityService],
})
export class PickupAvailabilityModule {}
