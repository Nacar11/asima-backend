import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { StoreUnavailabilityRepository } from '@/store-unavailability/persistence/repositories/store-unavailability.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StoreUnavailabilityEntity])],
  providers: [
    {
      provide: BaseStoreUnavailabilityRepository,
      useClass: StoreUnavailabilityRepository,
    },
  ],
  exports: [BaseStoreUnavailabilityRepository],
})
export class StoreUnavailabilityPersistenceModule {}
