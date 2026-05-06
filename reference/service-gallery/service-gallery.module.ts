import { Module, forwardRef } from '@nestjs/common';
import { ServiceGalleryService } from '@/service-gallery/service-gallery.service';
import { ServiceGalleryController } from '@/service-gallery/service-gallery.controller';
import { ServiceGalleryPersistenceModule } from '@/service-gallery/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';

@Module({
  imports: [ServiceGalleryPersistenceModule, forwardRef(() => ServicesModule)],
  controllers: [ServiceGalleryController],
  providers: [ServiceGalleryService],
  exports: [ServiceGalleryService, ServiceGalleryPersistenceModule],
})
export class ServiceGalleryModule {}
