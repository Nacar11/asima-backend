import { Module } from '@nestjs/common';
import { DocumentControlsService } from '@/document-controls/document-controls.service';
import { DocumentControlPersistenceModule } from '@/document-controls/persistence/persistence.module';
import { DocumentControlsController } from '@/document-controls/document-controls.controller';

@Module({
  imports: [
    // import modules, etc.
    DocumentControlPersistenceModule,
  ],
  controllers: [DocumentControlsController],
  providers: [DocumentControlsService],
  exports: [DocumentControlsService, DocumentControlPersistenceModule],
})
export class DocumentControlsModule {}
