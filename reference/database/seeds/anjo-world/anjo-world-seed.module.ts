import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnjoWorldSeedService } from './anjo-world-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { StorageModule } from '@/storage/storage.module';

@Module({
  imports: [
    StorageModule.register(),
    TypeOrmModule.forFeature([
      UserEntity,
      UserAddressEntity,
      SellerEntity,
      SellerScheduleEntity,
      ServiceCategoryEntity,
      ServiceEntity,
      ServiceAreaEntity,
      ServiceGalleryEntity,
      CurrencyEntity,
    ]),
  ],
  providers: [AnjoWorldSeedService],
  exports: [AnjoWorldSeedService],
})
export class AnjoWorldSeedModule {}
