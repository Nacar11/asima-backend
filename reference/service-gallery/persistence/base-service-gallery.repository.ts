import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { QueryServiceGalleryDto } from '@/service-gallery/dto/query-service-gallery.dto';

export abstract class BaseServiceGalleryRepository {
  abstract create(
    data: Omit<
      ServiceGallery,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<ServiceGallery>;

  abstract findAll(
    query: QueryServiceGalleryDto,
  ): Promise<{ data: ServiceGallery[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceGallery | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceGallery>,
  ): Promise<ServiceGallery>;

  abstract remove(id: number, causerId?: number): Promise<void>;

  abstract unsetPrimaryForService(
    serviceId: number,
    excludeId?: number,
  ): Promise<void>;
}
