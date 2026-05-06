import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { BaseServiceCategoryRepository } from '@/service-categories/persistence/base-service-category.repository';
import { ServiceCategoryRepository } from '@/service-categories/persistence/repositories/service-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategoryEntity])],
  providers: [
    {
      provide: BaseServiceCategoryRepository,
      useClass: ServiceCategoryRepository,
    },
  ],
  exports: [BaseServiceCategoryRepository],
})
export class ServiceCategoryPersistenceModule {}
