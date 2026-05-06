import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseCompanyRepository } from '@/companies/persistence/base-company.repository';
import { CompanyRepository } from '@/companies/persistence/repositories/company.repository';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';
import { CompanySubscriber } from '@/companies/persistence/subscriber/company.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  providers: [
    CompanySubscriber,
    {
      provide: BaseCompanyRepository,
      useClass: CompanyRepository,
    },
  ],
  exports: [BaseCompanyRepository],
})
export class CompanyPersistenceModule {}
