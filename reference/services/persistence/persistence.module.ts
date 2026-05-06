import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { ServiceRepository } from '@/services/persistence/repositories/service.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  providers: [
    {
      provide: BaseServiceRepository,
      useClass: ServiceRepository,
    },
  ],
  exports: [BaseServiceRepository],
})
export class ServicePersistenceModule {}
