import { Module } from '@nestjs/common';
import { ServiceMilestoneTemplatesService } from '@/service-milestone-templates/service-milestone-templates.service';
import { ServiceMilestoneTemplatesController } from '@/service-milestone-templates/service-milestone-templates.controller';
import { ServiceMilestoneTemplatePersistenceModule } from '@/service-milestone-templates/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';
import { ServicePackagesModule } from '@/service-packages/service-packages.module';

@Module({
  imports: [
    ServiceMilestoneTemplatePersistenceModule,
    ServicesModule,
    ServicePackagesModule,
  ],
  controllers: [ServiceMilestoneTemplatesController],
  providers: [ServiceMilestoneTemplatesService],
  exports: [
    ServiceMilestoneTemplatesService,
    ServiceMilestoneTemplatePersistenceModule,
  ],
})
export class ServiceMilestoneTemplatesModule {}
