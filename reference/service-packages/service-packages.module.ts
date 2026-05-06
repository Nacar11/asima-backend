import { Module, forwardRef } from '@nestjs/common';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { ServicePackagesController } from '@/service-packages/service-packages.controller';
import { ServicePackagePersistenceModule } from '@/service-packages/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';

@Module({
  imports: [ServicePackagePersistenceModule, forwardRef(() => ServicesModule)],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService],
  exports: [ServicePackagesService, ServicePackagePersistenceModule],
})
export class ServicePackagesModule {}
