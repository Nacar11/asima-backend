import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellersController } from '@/sellers/sellers.controller';
import { SellersService } from '@/sellers/sellers.service';
import { SellerPersistenceModule } from '@/sellers/persistence/persistence.module';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { UsersModule } from '@/users/users.module';
import { StorageModule } from '@/storage/storage.module';
import { ServicePersistenceModule } from '@/services/persistence/persistence.module';
import { ReviewPersistenceModule } from '@/reviews/persistence/persistence.module';
import { SellerSchedulesPersistenceModule } from '@/seller-schedules/persistence/persistence.module';
import { MemberSchedulesPersistenceModule } from '@/member-schedules/persistence/persistence.module';
import { StoreUnavailabilityPersistenceModule } from '@/store-unavailability/persistence/persistence.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';
import { SellerPortfolioPersistenceModule } from '@/seller-portfolio/persistence/persistence.module';
import { SellerEarningsModule } from '@/seller-earnings/seller-earnings.module';
import { UserAddressesModule } from '@/user-addresses/user-addresses.module';
import { PickupAvailabilityModule } from '@/sales-orders/pickup-availability.module';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';

/**
 * Sellers module
 * Encapsulates all seller-related functionality
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      CategoryEntity,
      TagEntity,
      AttributeEntity,
      SubscriptionEntity,
      UserAddressEntity,
    ]),
    SellerPersistenceModule,
    UsersModule,
    StorageModule.register(),
    ServicePersistenceModule,
    ReviewPersistenceModule,
    SellerSchedulesPersistenceModule,
    MemberSchedulesPersistenceModule,
    StoreUnavailabilityPersistenceModule,
    BookingPersistenceModule,
    SellerPortfolioPersistenceModule,
    SellerEarningsModule,
    UserAddressesModule,
    PickupAvailabilityModule,
  ],
  controllers: [SellersController],
  providers: [SellersService, SellerMapper],
  exports: [SellersService, SellerPersistenceModule],
})
export class SellersModule {}
