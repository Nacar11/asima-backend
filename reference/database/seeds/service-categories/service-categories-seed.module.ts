import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceCategoriesSeedService } from '@/database/seeds/service-categories/service-categories-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for service categories
 */
@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategoryEntity, UserEntity])],
  providers: [ServiceCategoriesSeedService],
  exports: [ServiceCategoriesSeedService],
})
export class ServiceCategoriesSeedModule {}
