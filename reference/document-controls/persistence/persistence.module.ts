import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseDocumentControlRepository } from '@/document-controls/persistence/base-document-control.repository';
import { DocumentControlRepository } from '@/document-controls/persistence/repositories/document-control.repository';
import { DocumentControlEntity } from '@/document-controls/persistence/entities/document-control.entity';
import { DocumentControlSubscriber } from '@/document-controls/persistence/subscriber/document-control.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentControlEntity])],
  providers: [
    DocumentControlSubscriber,
    {
      provide: BaseDocumentControlRepository,
      useClass: DocumentControlRepository,
    },
  ],
  exports: [BaseDocumentControlRepository],
})
export class DocumentControlPersistenceModule {}
