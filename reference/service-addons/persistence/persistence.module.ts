import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAddonEntity } from './entities/service-addon.entity';
import { ServiceAddonInclusionEntity } from './entities/service-addon-inclusion.entity';
import { ServiceAddonRepository } from './repositories/service-addon.repository';
import { BaseServiceAddonRepository } from './base-service-addon.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceAddonEntity, ServiceAddonInclusionEntity]),
  ],
  providers: [
    {
      provide: BaseServiceAddonRepository,
      useClass: ServiceAddonRepository,
    },
  ],
  exports: [BaseServiceAddonRepository],
})
export class ServiceAddonPersistenceModule {}
