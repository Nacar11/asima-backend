import { Module } from '@nestjs/common';
import { ParametersService } from '@/parameters/parameters.service';
import { ParametersController } from '@/parameters/parameters.controller';
import { ParametersPersistenceModule } from '@/parameters/persistence/persistence.module';
import { CompaniesModule } from '@/companies/companies.module';

@Module({
  imports: [
    // import modules, etc.
    ParametersPersistenceModule,
    CompaniesModule,
  ],
  controllers: [ParametersController],
  providers: [ParametersService],
  exports: [ParametersService, ParametersPersistenceModule],
})
export class ParametersModule {}
