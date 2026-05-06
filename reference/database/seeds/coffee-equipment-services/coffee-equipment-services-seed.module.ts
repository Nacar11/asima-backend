import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { CoffeeEquipmentServicesSeedService } from './coffee-equipment-services-seed.service';

/**
 * Seed module for coffee equipment services company
 * Creates a complete seller with schedules, categories, services, addons, options, and service areas
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SellerEntity,
      SellerScheduleEntity,
      ServiceCategoryEntity,
      ServiceEntity,
      ServiceAddonEntity,
      ServiceOptionGroupEntity,
      ServiceOptionValueEntity,
      ServiceAreaEntity,
      ServiceMilestoneTemplateEntity,
      ServiceGalleryEntity,
      CurrencyEntity,
    ]),
  ],
  providers: [CoffeeEquipmentServicesSeedService],
  exports: [CoffeeEquipmentServicesSeedService],
})
export class CoffeeEquipmentServicesSeedModule {}
