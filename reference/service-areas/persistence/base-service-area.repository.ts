import { ServiceArea } from '@/service-areas/domain/service-area';
import { QueryServiceAreaDto } from '@/service-areas/dto/query-service-area.dto';

export abstract class BaseServiceAreaRepository {
  abstract create(
    data: Omit<ServiceArea, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<ServiceArea>;

  abstract findAll(
    query: QueryServiceAreaDto,
  ): Promise<{ data: ServiceArea[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceArea | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceArea>,
  ): Promise<ServiceArea>;

  abstract remove(id: number, causerId?: number): Promise<void>;

  /**
   * Find active service areas for a given service.
   *
   * @param serviceId - Service ID
   * @returns Promise<ServiceArea[]> - Active service areas
   */
  abstract findByServiceId(serviceId: number): Promise<ServiceArea[]>;

  /**
   * Check if a location is within any service area for a given service.
   *
   * Checks by city/province/postal_code match OR by radius if coordinates provided.
   * If no service areas are defined, uses service_radius_km as fallback for distance check.
   *
   * @param options - Location check options
   * @returns Promise<{ covered: boolean; area?: ServiceArea; additional_fee?: number }>
   */
  abstract checkLocationCoverage(options: {
    service_id: number;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    service_radius_km?: number | null;
    seller_latitude?: number | null;
    seller_longitude?: number | null;
  }): Promise<{
    covered: boolean;
    area?: ServiceArea | null;
    additional_fee?: number;
  }>;
}
