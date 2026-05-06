import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ServiceGalleryMapper {
  /**
   * Build full URL from a raw MinIO object key.
   * Matches the same logic used by MediaMapper so service gallery
   * images are reachable in both local dev and deployed environments.
   */
  private static buildImageUrl(imageUrl: string): string {
    // Already a full URL — return as-is
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('assets/')
    ) {
      return imageUrl;
    }

    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'media';
    const encodedPath = imageUrl
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  static toDomain(raw: ServiceGalleryEntity): ServiceGallery {
    const domain = new ServiceGallery();
    domain.id = raw.id;
    domain.service_id = raw.service_id;
    domain.image_url = this.buildImageUrl(raw.image_url);
    domain.caption = raw.caption;
    domain.alt_text = raw.alt_text;
    domain.is_primary = raw.is_primary;
    domain.display_order = raw.display_order;
    domain.status = raw.status;

    if (raw.service) domain.service = ServiceMapper.toDomain(raw.service);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;
    return domain;
  }

  static toPersistence(domain: ServiceGallery): ServiceGalleryEntity {
    const entity = new ServiceGalleryEntity();
    if (domain.id) entity.id = domain.id;
    entity.service_id = domain.service_id;
    entity.image_url = domain.image_url;
    entity.caption = domain.caption ?? null;
    entity.alt_text = domain.alt_text ?? null;
    entity.is_primary = domain.is_primary ?? false;
    entity.display_order = domain.display_order ?? 0;
    entity.status = domain.status ?? 'Active';

    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;
    return entity;
  }
}
