import { Module, forwardRef } from '@nestjs/common';
import { SellersModule } from '@/sellers/sellers.module';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { SellerSchedulesController } from '@/seller-schedules/seller-schedules.controller';
import { SellerSchedulesPersistenceModule } from '@/seller-schedules/persistence/persistence.module';
import { StoreUnavailabilityPersistenceModule } from '@/store-unavailability/persistence/persistence.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';
import { ServiceAreaPersistenceModule } from '@/service-areas/persistence/persistence.module';
import { ParametersModule } from '@/parameters/parameters.module';

/**
 * Seller Schedules Module
 * Simplified: No member schedules dependency (seller is the provider).
 * Includes service area validation for location-based availability.
 */
@Module({
  imports: [
    SellerSchedulesPersistenceModule,
    StoreUnavailabilityPersistenceModule,
    SellersModule,
    BookingPersistenceModule,
    forwardRef(() => ServicesModule),
    ServiceAreaPersistenceModule,
    ParametersModule,
  ],
  controllers: [SellerSchedulesController],
  providers: [SellerSchedulesService],
  exports: [SellerSchedulesService, SellerSchedulesPersistenceModule],
})
export class SellerSchedulesModule {}
