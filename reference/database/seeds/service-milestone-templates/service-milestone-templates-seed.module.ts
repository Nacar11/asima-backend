import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceMilestoneTemplatesSeedService } from '@/database/seeds/service-milestone-templates/service-milestone-templates-seed.service';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for service milestone templates
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceMilestoneTemplateEntity,
      ServiceEntity,
      UserEntity,
    ]),
  ],
  providers: [ServiceMilestoneTemplatesSeedService],
  exports: [ServiceMilestoneTemplatesSeedService],
})
export class ServiceMilestoneTemplatesSeedModule {}
