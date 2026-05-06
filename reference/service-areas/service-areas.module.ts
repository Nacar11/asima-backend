import { Module, forwardRef } from '@nestjs/common';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { ServiceAreasController } from '@/service-areas/service-areas.controller';
import { ServiceAreaPersistenceModule } from '@/service-areas/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';
import { SellersModule } from '@/sellers/sellers.module';

@Module({
  imports: [
    ServiceAreaPersistenceModule,
    forwardRef(() => ServicesModule),
    forwardRef(() => SellersModule),
  ],
  controllers: [ServiceAreasController],
  providers: [ServiceAreasService],
  exports: [ServiceAreasService, ServiceAreaPersistenceModule],
})
export class ServiceAreasModule {}
