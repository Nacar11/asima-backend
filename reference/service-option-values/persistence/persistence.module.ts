import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOptionValueEntity } from './entities/service-option-value.entity';
import { ServiceOptionValueRepository } from './repositories/service-option-value.repository';
import { BaseServiceOptionValueRepository } from './base-service-option-value.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOptionValueEntity])],
  providers: [
    {
      provide: BaseServiceOptionValueRepository,
      useClass: ServiceOptionValueRepository,
    },
  ],
  exports: [BaseServiceOptionValueRepository],
})
export class ServiceOptionValuePersistenceModule {}
