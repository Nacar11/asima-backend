import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentEntity } from '@/storage/persistence/entities/attachment.entity';
import { AttachmentRepository } from '@/storage/persistence/repositories/attachment.repository';
import { BaseAttachmentRepository } from '@/storage/persistence/base-attachment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [
    AttachmentRepository,
    { provide: BaseAttachmentRepository, useClass: AttachmentRepository },
  ],
  exports: [BaseAttachmentRepository, AttachmentRepository, TypeOrmModule],
})
export class AttachmentPersistenceModule {}
