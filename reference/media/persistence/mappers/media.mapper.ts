import { Media } from '@/media/domain/media';
import { MediaEntity } from '@/media/persistence/entities/media.entity';

export class MediaMapper {
  /**
   * Build full URL from a file path
   */
  private static buildUrl(
    filePath: string,
    publicEndpoint: string,
    bucket: string,
  ): string {
    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  static toDomain(raw: MediaEntity): Media {
    const domainEntity = new Media();

    Object.assign(domainEntity, raw);

    // Note: created_by, updated_by, deleted_by are stored as number IDs in MediaEntity
    // They are copied via Object.assign above

    // Add URLs based on MinIO configuration
    if (raw.id) {
      const publicEndpoint =
        process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
      const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'media';

      // Main file URL
      domainEntity.url = this.buildUrl(raw.file_path, publicEndpoint, bucket);

      // Legacy aliases for clients expecting file_url/file_type
      domainEntity.file_url = domainEntity.url;
      domainEntity.file_type = raw.mime_type;

      // Processed variant URLs
      if (raw.thumbnail_path) {
        domainEntity.thumbnail_url = this.buildUrl(
          raw.thumbnail_path,
          publicEndpoint,
          bucket,
        );
      }
      if (raw.preview_path) {
        domainEntity.preview_url = this.buildUrl(
          raw.preview_path,
          publicEndpoint,
          bucket,
        );
      }
      if (raw.compressed_path) {
        domainEntity.compressed_url = this.buildUrl(
          raw.compressed_path,
          publicEndpoint,
          bucket,
        );
      }
      if (raw.watermarked_path) {
        domainEntity.watermarked_url = this.buildUrl(
          raw.watermarked_path,
          publicEndpoint,
          bucket,
        );
      }
    }

    return domainEntity;
  }

  static toEntity(domainEntity: Media): MediaEntity {
    const persistenceEntity = new MediaEntity();
    Object.assign(persistenceEntity, domainEntity as Omit<Media, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
