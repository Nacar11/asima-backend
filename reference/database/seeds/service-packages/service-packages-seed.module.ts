import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { ServicePackagesSeedService } from '@/database/seeds/service-packages/service-packages-seed.service';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for service packages
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ServicePackageEntity, ServiceEntity, UserEntity]),
  ],
  providers: [ServicePackagesSeedService],
  exports: [ServicePackagesSeedService],
})
export class ServicePackagesSeedModule {}
