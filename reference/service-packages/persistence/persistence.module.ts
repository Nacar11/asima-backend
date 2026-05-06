import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { BaseServicePackageRepository } from '@/service-packages/persistence/base-service-package.repository';
import { ServicePackageRepository } from '@/service-packages/persistence/repositories/service-package.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServicePackageEntity])],
  providers: [
    {
      provide: BaseServicePackageRepository,
      useClass: ServicePackageRepository,
    },
  ],
  exports: [BaseServicePackageRepository],
})
export class ServicePackagePersistenceModule {}
