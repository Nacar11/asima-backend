import { Module } from '@nestjs/common';
import { DocumentSignatoriesService } from '@/document-signatories/document-signatories.service';
import { DocumentSignatoriesController } from '@/document-signatories/document-signatories.controller';
import { DocumentSignatoryPersistenceModule } from '@/document-signatories/persistence/persistence.module';
import { MenusModule } from '@/menus/menus.module';

@Module({
  imports: [
    // import modules, etc.
    DocumentSignatoryPersistenceModule,
    MenusModule,
  ],
  controllers: [DocumentSignatoriesController],
  providers: [DocumentSignatoriesService],
  exports: [DocumentSignatoriesService, DocumentSignatoryPersistenceModule],
})
export class DocumentSignatoriesModule {}
