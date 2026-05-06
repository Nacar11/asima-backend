import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { BaseServiceAreaRepository } from '@/service-areas/persistence/base-service-area.repository';
import { ServiceAreaRepository } from '@/service-areas/persistence/repositories/service-area.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceAreaEntity])],
  providers: [
    {
      provide: BaseServiceAreaRepository,
      useClass: ServiceAreaRepository,
    },
  ],
  exports: [BaseServiceAreaRepository],
})
export class ServiceAreaPersistenceModule {}
