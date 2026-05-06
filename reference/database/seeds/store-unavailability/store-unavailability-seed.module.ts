import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { StoreUnavailabilitySeedService } from '@/database/seeds/store-unavailability/store-unavailability-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for store unavailability
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreUnavailabilityEntity,
      SellerEntity,
      UserEntity,
    ]),
  ],
  providers: [StoreUnavailabilitySeedService],
  exports: [StoreUnavailabilitySeedService],
})
export class StoreUnavailabilitySeedModule {}
