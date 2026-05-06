import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { BaseServiceGalleryRepository } from '@/service-gallery/persistence/base-service-gallery.repository';
import { ServiceGalleryRepository } from '@/service-gallery/persistence/repositories/service-gallery.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceGalleryEntity])],
  providers: [
    {
      provide: BaseServiceGalleryRepository,
      useClass: ServiceGalleryRepository,
    },
  ],
  exports: [BaseServiceGalleryRepository],
})
export class ServiceGalleryPersistenceModule {}
