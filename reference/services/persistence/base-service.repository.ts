import { Service } from '@/services/domain/service';
import { QueryServiceDto } from '@/services/dto/query-service.dto';
import {
  ScheduleByCourtBlockedSlotDto,
  ScheduleByCourtBookingDto,
} from '@/services/dto/schedule-by-court-response.dto';
import { ScheduleByCourtQueryDto } from '@/services/dto/schedule-by-court-query.dto';

export abstract class BaseServiceRepository {
  abstract create(
    data: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Service>;

  abstract findAll(
    query: QueryServiceDto,
  ): Promise<{ data: Service[]; totalCount: number }>;

  abstract findById(id: number): Promise<Service | null>;

  abstract findByCode(code: string): Promise<Service | null>;

  abstract findFeatured(
    limit?: number,
    sellerId?: number,
    excludeSellerSlugs?: string[],
  ): Promise<{ data: Service[]; totalCount: number }>;

  abstract findPopular(
    limit?: number,
    sellerId?: number,
  ): Promise<{ data: Service[]; totalCount: number }>;

  abstract findNearby(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    sellerId?: number;
  }): Promise<{ data: Service[]; totalCount: number }>;

  abstract search(params: {
    q?: string;
    sellerId?: number;
    categoryIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    pricingType?: string;
    isFeatured?: boolean;
    instantBooking?: boolean;
    isRemoteAvailable?: boolean;
    serviceLocationType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    province?: string;
  }): Promise<{ data: Service[]; totalCount: number }>;

  abstract suggestions(q?: string, limit?: number): Promise<string[]>;

  abstract findScheduleByCourt(
    query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtBookingDto[]>;

  abstract findScheduleByCourtBlockedSlots(
    query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtBlockedSlotDto[]>;

  abstract findDetail(id: number): Promise<{
    service: Service | null;
    packages: any[];
    areas: any[];
    gallery: any[];
  }>;

  abstract update(id: number, payload: Partial<Service>): Promise<Service>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
