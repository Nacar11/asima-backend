import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOptionGroupEntity } from './entities/service-option-group.entity';
import { ServiceOptionGroupRepository } from './repositories/service-option-group.repository';
import { BaseServiceOptionGroupRepository } from './base-service-option-group.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOptionGroupEntity])],
  providers: [
    {
      provide: BaseServiceOptionGroupRepository,
      useClass: ServiceOptionGroupRepository,
    },
  ],
  exports: [BaseServiceOptionGroupRepository],
})
export class ServiceOptionGroupPersistenceModule {}
