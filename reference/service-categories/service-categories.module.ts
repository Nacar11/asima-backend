import { Module } from '@nestjs/common';
import { ServiceCategoriesService } from '@/service-categories/service-categories.service';
import { ServiceCategoriesController } from '@/service-categories/service-categories.controller';
import { ServiceCategoryPersistenceModule } from '@/service-categories/persistence/persistence.module';

@Module({
  imports: [ServiceCategoryPersistenceModule],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService, ServiceCategoryPersistenceModule],
})
export class ServiceCategoriesModule {}
