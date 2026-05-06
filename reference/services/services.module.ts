import { Module, forwardRef } from '@nestjs/common';
import { ServicesService } from '@/services/services.service';
import { ServicesController } from '@/services/services.controller';
import { PublicServicesController } from '@/services/public-services.controller';
import { ServicePersistenceModule } from '@/services/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';
import { ServiceCategoriesModule } from '@/service-categories/service-categories.module';
import { CurrenciesModule } from '@/currencies/currencies.module';
import { SellerSchedulesModule } from '@/seller-schedules/seller-schedules.module';
import { ServicePackagesModule } from '@/service-packages/service-packages.module';
import { ServiceAreasModule } from '@/service-areas/service-areas.module';
import { ServiceGalleryModule } from '@/service-gallery/service-gallery.module';
import { ReviewPersistenceModule } from '@/reviews/persistence/persistence.module';
import { FormTemplatesModule } from '@/form-templates/form-templates.module';

@Module({
  imports: [
    ServicePersistenceModule,
    SellersModule,
    ServiceCategoriesModule,
    CurrenciesModule,
    forwardRef(() => SellerSchedulesModule),
    forwardRef(() => ServicePackagesModule),
    forwardRef(() => ServiceAreasModule),
    forwardRef(() => ServiceGalleryModule),
    ReviewPersistenceModule,
    forwardRef(() => FormTemplatesModule),
  ],
  controllers: [PublicServicesController, ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, ServicePersistenceModule],
})
export class ServicesModule {}
