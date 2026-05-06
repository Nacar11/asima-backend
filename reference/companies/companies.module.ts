import { Module } from '@nestjs/common';
import { CompaniesService } from '@/companies/companies.service';
import { CompaniesController } from '@/companies/companies.controller';
import { CompanyPersistenceModule } from '@/companies/persistence/persistence.module';
import { StorageModule } from '@/storage/storage.module';
import { AttachmentsModule } from '@/attachments/attachments.module';

@Module({
  imports: [
    // import modules, etc.
    CompanyPersistenceModule,
    StorageModule.register(),
    AttachmentsModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService, CompanyPersistenceModule],
})
export class CompaniesModule {}
