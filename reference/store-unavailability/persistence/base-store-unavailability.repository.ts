import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { QueryStoreUnavailabilityDto } from '@/store-unavailability/dto/query-store-unavailability.dto';

/**
 * Base Store Unavailability Repository.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
export abstract class BaseStoreUnavailabilityRepository {
  abstract create(
    data: Omit<StoreUnavailability, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<StoreUnavailability>;

  abstract findAll(
    query: QueryStoreUnavailabilityDto,
  ): Promise<{ data: StoreUnavailability[]; totalCount: number }>;

  abstract findById(id: number): Promise<StoreUnavailability | null>;

  abstract update(
    id: number,
    payload: Partial<StoreUnavailability>,
  ): Promise<StoreUnavailability>;

  abstract remove(id: number, causerId?: number): Promise<void>;

  abstract findOverlapsForWindow(params: {
    seller_id: number;
    service_id?: number | null;
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<StoreUnavailability[]>;
}
