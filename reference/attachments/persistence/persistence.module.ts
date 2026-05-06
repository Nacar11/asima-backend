import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseAttachmentsRepository } from '@/attachments/persistence/base-attachments.repository';
import { AttachmentsRepository } from '@/attachments/persistence/repositories/attachments.repository';
import { AttachmentsEntity } from '@/attachments/persistence/entities/attachments.entity';
import { AttachmentSubscriber } from '@/attachments/persistence/subscribers/attachments.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentsEntity])],
  providers: [
    AttachmentSubscriber,
    {
      provide: BaseAttachmentsRepository,
      useClass: AttachmentsRepository,
    },
  ],
  exports: [BaseAttachmentsRepository],
})
export class AttachmentsPersistenceModule {}
