import { Injectable } from '@nestjs/common';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { Media } from '@/media/domain/media';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StorageService } from '@/storage/storage.service';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';

@Injectable()
export class MediaUsersService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  /**
   * Sanitize filename to be URL-safe
   */
  private sanitizeFilename(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    const name =
      lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    const sanitized = name
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${sanitized}${ext}`.toLowerCase();
  }

  /**
   * Upload a file for a user (stored under media/users/{userId}/...)
   */
  async uploadFile(
    file: Express.Multer.File,
    metadata: {
      title?: string;
      alt_text?: string;
      description?: string;
      user_id: number;
    },
  ): Promise<Media> {
    const mediaType = file.mimetype.startsWith('image')
      ? MediaTypeEnum.IMAGE
      : MediaTypeEnum.VIDEO;

    // Generate file path with timestamp and sanitized filename
    const timestamp = Date.now();
    const sanitizedName = this.sanitizeFilename(file.originalname);
    const fileName = `${timestamp}-${sanitizedName}`;
    const folderPath =
      mediaType === MediaTypeEnum.IMAGE
        ? `media/users/${metadata.user_id}/images/originals`
        : `media/users/${metadata.user_id}/videos/originals`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload to S3/MinIO
    const uploadResult = await this.storageService.put(file, filePath);

    // Create media record (no seller_id for user uploads)
    const media = new Media();
    media.file_name = file.originalname;
    media.file_path = uploadResult.key;
    media.file_size = file.size;
    media.mime_type = file.mimetype;
    media.media_type = mediaType;
    media.title = metadata.title;
    media.alt_text = metadata.alt_text;
    media.description = metadata.description;
    media.seller_id = undefined; // User uploads don't belong to a seller
    media.created_by = metadata.user_id; // Track ownership for validation
    media.processing_status = ProcessingStatusEnum.PENDING;
    media.status = StatusEnum.ACTIVE;

    // Process image if it's an image type
    if (mediaType === MediaTypeEnum.IMAGE) {
      try {
        const processResult = await this.imageProcessor.processImage(
          file.buffer,
          uploadResult.key,
        );

        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = processResult.preview_path;
        media.compressed_path = processResult.compressed_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (error) {
        console.error('Image processing failed:', error);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    } else {
      try {
        const processResult = await this.imageProcessor.processVideo(
          file.buffer,
          uploadResult.key,
        );

        if (processResult.converted_path) {
          await this.storageService.delete(uploadResult.key);
          media.file_path = processResult.converted_path;
          media.mime_type = 'video/mp4';
        }

        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = media.file_path;
        media.compressed_path = media.file_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (error) {
        console.error('Video processing failed:', error);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    }

    return this.mediaRepository.create(media);
  }

  /**
   * Create media from a Multer file (convenience method for return requests)
   */
  async createMediaFromFile(
    file: Express.Multer.File,
    userId: number,
  ): Promise<Media> {
    return this.uploadFile(file, {
      title: `Return evidence - ${file.originalname}`,
      alt_text: `Return request evidence uploaded by user ${userId}`,
      description: 'Image uploaded as return request evidence',
      user_id: userId,
    });
  }
}
