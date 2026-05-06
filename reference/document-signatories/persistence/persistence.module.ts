import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseDocumentSignatoryRepository } from '@/document-signatories/persistence/base-document-signatory.repository';
import { DocumentSignatoryRepository } from '@/document-signatories/persistence/repositories/document-signatory.repository';
import { DocumentSignatoryEntity } from '@/document-signatories/persistence/entities/document-signatory.entity';
import { DocumentSignatorySubscriber } from '@/document-signatories/persistence/subscriber/document-signatory.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentSignatoryEntity])],
  providers: [
    DocumentSignatorySubscriber,
    {
      provide: BaseDocumentSignatoryRepository,
      useClass: DocumentSignatoryRepository,
    },
  ],
  exports: [BaseDocumentSignatoryRepository],
})
export class DocumentSignatoryPersistenceModule {}
