import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MepfServicesSeedService } from './mepf-services-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { FormTemplateEntity } from '@/form-templates/persistence/entities/form-template.entity';
import { FormTemplateOptionEntity } from '@/form-templates/persistence/entities/form-template-option.entity';
import { FormTemplateValidationRuleEntity } from '@/form-templates/persistence/entities/form-template-validation-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SellerEntity,
      SellerScheduleEntity,
      ServiceCategoryEntity,
      ServiceEntity,
      ServiceAreaEntity,
      ServiceMilestoneTemplateEntity,
      ServiceGalleryEntity,
      CurrencyEntity,
      FormTemplateEntity,
      FormTemplateOptionEntity,
      FormTemplateValidationRuleEntity,
    ]),
  ],
  providers: [MepfServicesSeedService],
  exports: [MepfServicesSeedService],
})
export class MepfServicesSeedModule {}
