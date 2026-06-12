import { Module } from '@nestjs/common';
import { BaseStorageService } from '@/storage/base-storage.service';
import { S3Storage } from '@/storage/s3-storage.service';
import { ImageProcessorService } from '@/storage/image-processor.service';
import { AttachmentService } from '@/storage/attachment.service';
import { AttachmentPersistenceModule } from '@/storage/persistence/persistence.module';

/**
 * Object-storage module. Binds the storage port to the S3 driver (MinIO
 * locally, AWS deployed — one adapter), and exposes `AttachmentService`
 * as the seam every file consumer (leave attachments today, profile
 * photos later) reuses.
 */
@Module({
  imports: [AttachmentPersistenceModule],
  providers: [
    ImageProcessorService,
    AttachmentService,
    { provide: BaseStorageService, useClass: S3Storage },
  ],
  exports: [BaseStorageService, AttachmentService],
})
export class StorageModule {}
