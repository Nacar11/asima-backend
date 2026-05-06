import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseParametersRepository } from '@/parameters/persistence/base-parameters.repository';
import { ParameterRepository } from '@/parameters/persistence/repositories/parameters.repository';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { ParametersSubscriber } from '@/parameters/persistence/subscriber/parameters.subscriber';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParameterEntity, CompanyEntity])],
  providers: [
    ParametersSubscriber,
    {
      provide: BaseParametersRepository,
      useClass: ParameterRepository,
    },
  ],
  exports: [BaseParametersRepository],
})
export class ParametersPersistenceModule {}
