import { Module } from '@nestjs/common';
import { AttachmentsService } from '@/attachments/attachments.service';
import { AttachmentsController } from '@/attachments/attachments.controller';
import { AttachmentsPersistenceModule } from '@/attachments/persistence/persistence.module';

@Module({
  imports: [
    // import modules, etc.
    AttachmentsPersistenceModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService, AttachmentsPersistenceModule],
})
export class AttachmentsModule {}
