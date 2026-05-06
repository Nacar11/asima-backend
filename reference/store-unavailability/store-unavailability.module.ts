import { Module } from '@nestjs/common';
import { StoreUnavailabilityService } from '@/store-unavailability/store-unavailability.service';
import { StoreUnavailabilityController } from '@/store-unavailability/store-unavailability.controller';
import { StoreUnavailabilityPersistenceModule } from '@/store-unavailability/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';
import { ServicesModule } from '@/services/services.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';
import { AvailabilityRealtimeModule } from '@/availability-realtime/availability-realtime.module';

/**
 * Store Unavailability Module.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
@Module({
  imports: [
    StoreUnavailabilityPersistenceModule,
    SellersModule,
    ServicesModule,
    BookingPersistenceModule,
    AvailabilityRealtimeModule,
  ],
  controllers: [StoreUnavailabilityController],
  providers: [StoreUnavailabilityService],
  exports: [StoreUnavailabilityService, StoreUnavailabilityPersistenceModule],
})
export class StoreUnavailabilityModule {}
