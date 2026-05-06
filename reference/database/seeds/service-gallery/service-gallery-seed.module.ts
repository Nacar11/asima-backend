import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { ServiceGallerySeedService } from '@/database/seeds/service-gallery/service-gallery-seed.service';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for service gallery
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceGalleryEntity, ServiceEntity, UserEntity]),
  ],
  providers: [ServiceGallerySeedService],
  exports: [ServiceGallerySeedService],
})
export class ServiceGallerySeedModule {}
