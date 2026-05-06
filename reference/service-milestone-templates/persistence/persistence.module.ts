import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { BaseServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/base-service-milestone-template.repository';
import { ServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/repositories/service-milestone-template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceMilestoneTemplateEntity])],
  providers: [
    {
      provide: BaseServiceMilestoneTemplateRepository,
      useClass: ServiceMilestoneTemplateRepository,
    },
  ],
  exports: [BaseServiceMilestoneTemplateRepository],
})
export class ServiceMilestoneTemplatePersistenceModule {}
