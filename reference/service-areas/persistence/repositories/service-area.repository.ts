import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseServiceAreaRepository } from '@/service-areas/persistence/base-service-area.repository';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceAreaMapper } from '@/service-areas/persistence/mappers/service-area.mapper';
import { ServiceArea } from '@/service-areas/domain/service-area';
import { QueryServiceAreaDto } from '@/service-areas/dto/query-service-area.dto';

function parseDevExtremeFilter(filter: any): {
  cityProvinceSearch?: string;
  status?: string;
} {
  const result: {
    cityProvinceSearch?: string;
    status?: string;
  } = {};

  if (!filter || !Array.isArray(filter)) {
    return result;
  }

  function extractConditions(node: any): void {
    if (!Array.isArray(node)) {
      return;
    }

    // Check if this is a condition array [field, operator, value]
    if (
      node.length === 3 &&
      typeof node[0] === 'string' &&
      typeof node[1] === 'string'
    ) {
      const [field, operator, value] = node;

      if (field === 'status' && (operator === '=' || operator === '==')) {
        result.status = String(value);
        return;
      }

      // Handle contains operations for city and province
      if (
        operator === 'contains' &&
        (field === 'city' || field === 'province')
      ) {
        // If we already have a search value and it's different, we need to handle OR logic
        // For simplicity, we'll use the first one found (DevExtreme sends OR conditions)
        if (!result.cityProvinceSearch) {
          result.cityProvinceSearch = String(value);
        }
        return;
      }
    }

    // Recursively process nested arrays
    for (const item of node) {
      if (Array.isArray(item)) {
        extractConditions(item);
      }
    }
  }

  extractConditions(filter);
  return result;
}

@Injectable()
export class ServiceAreaRepository implements BaseServiceAreaRepository {
  constructor(
    @InjectRepository(ServiceAreaEntity)
    private readonly repo: Repository<ServiceAreaEntity>,
  ) {}

  async create(data: ServiceArea): Promise<ServiceArea> {
    const saved = await this.repo.save(
      this.repo.create(ServiceAreaMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceAreaMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceAreaDto,
  ): Promise<{ data: ServiceArea[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    // Parse DevExtreme filter if present
    const filterConditions =
      query.filter !== undefined ? parseDevExtremeFilter(query.filter) : {};

    // Build base query builder
    const queryBuilder = this.repo.createQueryBuilder('service_area');

    // Add relations
    queryBuilder
      .leftJoinAndSelect('service_area.seller', 'seller')
      .leftJoinAndSelect('service_area.service', 'service')
      .leftJoinAndSelect('service_area.created_by', 'created_by')
      .leftJoinAndSelect('service_area.updated_by', 'updated_by')
      .leftJoinAndSelect('service_area.deleted_by', 'deleted_by');

    // Handle search from query.search parameter or filter
    const searchValue = query.search || filterConditions.cityProvinceSearch;
    if (searchValue) {
      queryBuilder.andWhere(
        '(service_area.city ILIKE :search OR service_area.province ILIKE :search OR service_area.postal_code ILIKE :search)',
        { search: `%${searchValue}%` },
      );
    }

    // Handle other filters
    if (query.service_id !== undefined) {
      queryBuilder.andWhere('service_area.service_id = :serviceId', {
        serviceId: query.service_id,
      });
    }
    if (query.additional_fee_type !== undefined) {
      queryBuilder.andWhere('service_area.additional_fee_type = :feeType', {
        feeType: query.additional_fee_type,
      });
    }
    // Filter by seller_id directly on service_area
    if (query.seller_id !== undefined) {
      queryBuilder.andWhere('service_area.seller_id = :sellerId', {
        sellerId: query.seller_id,
      });
    }

    // Handle status filter (from query parameter or filter)
    const statusValue = query.status ?? filterConditions.status;
    if (statusValue !== undefined) {
      queryBuilder.andWhere('service_area.status = :status', {
        status: statusValue,
      });
    }

    // Handle sorting
    if (query.sort && Array.isArray(query.sort) && query.sort.length > 0) {
      // Clear default ordering
      queryBuilder.orderBy();

      // Map frontend field names (camelCase) to database column names (snake_case)
      const fieldMapping: Record<string, string> = {
        areaName: 'service_area.city', // Sort by city when sorting by areaName
        city: 'service_area.city',
        province: 'service_area.province',
        radiusKm: 'service_area.radius_km',
        radius_km: 'service_area.radius_km',
        additionalFee: 'service_area.additional_fee',
        additional_fee: 'service_area.additional_fee',
        'seller.store_name': 'seller.store_name', // Sort by seller store name
        status: 'service_area.status',
        createdAt: 'service_area.created_at',
        updatedAt: 'service_area.updated_at',
      };

      // Apply sorting from DevExtreme format: [{selector: "field", desc: true/false}]
      query.sort.forEach((sortItem: any, index: number) => {
        if (sortItem && typeof sortItem === 'object' && sortItem.selector) {
          const fieldName = sortItem.selector;
          const dbField =
            fieldMapping[fieldName] || `service_area.${fieldName}`;
          const direction = sortItem.desc ? 'DESC' : 'ASC';

          if (index === 0) {
            queryBuilder.orderBy(dbField, direction);
          } else {
            queryBuilder.addOrderBy(dbField, direction);
          }
        }
      });
    } else {
      // Default ordering if no sort specified
      queryBuilder.orderBy('service_area.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(skip).take(take);

    // Execute query
    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((e) => ServiceAreaMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceArea | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? ServiceAreaMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceArea>,
  ): Promise<ServiceArea> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Area not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceAreaMapper.toPersistence({
          ...ServiceAreaMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceAreaMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Area not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: 'Inactive',
    });
  }

  /**
   * Find active service areas for a given service.
   *
   * @param serviceId - Service ID
   * @returns Promise<ServiceArea[]> - Active service areas
   */
  async findByServiceId(serviceId: number): Promise<ServiceArea[]> {
    const entities = await this.repo.find({
      where: {
        service_id: serviceId,
        status: 'Active',
      },
      relations: ['service'],
    });
    return entities.map((e) => ServiceAreaMapper.toDomain(e));
  }

  /**
   * Check if a location is within any service area for a given service.
   *
   * Checks by city/province/postal_code match OR by radius if coordinates provided.
   *
   * @param options - Location check options
   * @returns Promise<{ covered: boolean; area?: ServiceArea; additional_fee?: number }>
   */
  async checkLocationCoverage(options: {
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
  }> {
    // Get all active service areas for this service
    const areas = await this.findByServiceId(options.service_id);

    // If no service areas defined, use service_radius_km fallback if coordinates are provided
    if (areas.length === 0) {
      // If we have service_radius_km and seller/customer coordinates, check distance
      if (
        options.service_radius_km &&
        options.seller_latitude &&
        options.seller_longitude &&
        options.latitude &&
        options.longitude
      ) {
        const distance = this.calculateDistance(
          options.latitude,
          options.longitude,
          options.seller_latitude,
          options.seller_longitude,
        );

        if (distance <= options.service_radius_km) {
          return { covered: true, area: null, additional_fee: 0 };
        } else {
          return { covered: false, area: null, additional_fee: 0 };
        }
      }

      // No service areas defined and no radius check available - assume service is available everywhere
      return { covered: true, area: null, additional_fee: 0 };
    }

    // Check for exact match by city/province/postal_code
    for (const area of areas) {
      // Check postal code match (most specific)
      if (
        options.postal_code &&
        area.postal_code &&
        area.postal_code.toLowerCase() === options.postal_code.toLowerCase()
      ) {
        return {
          covered: true,
          area,
          additional_fee: Number(area.additional_fee) || 0,
        };
      }

      // Check city and province match
      if (options.city && area.city) {
        const cityMatch =
          area.city.toLowerCase() === options.city.toLowerCase();
        const provinceMatch =
          !area.province ||
          !options.province ||
          area.province.toLowerCase() === options.province.toLowerCase();

        if (cityMatch && provinceMatch) {
          return {
            covered: true,
            area,
            additional_fee: Number(area.additional_fee) || 0,
          };
        }
      }

      // Check by radius if coordinates are provided
      if (
        options.latitude &&
        options.longitude &&
        area.center_latitude &&
        area.center_longitude &&
        area.radius_km
      ) {
        const distance = this.calculateDistance(
          options.latitude,
          options.longitude,
          Number(area.center_latitude),
          Number(area.center_longitude),
        );

        if (distance <= area.radius_km) {
          return {
            covered: true,
            area,
            additional_fee: Number(area.additional_fee) || 0,
          };
        }
      }
    }

    // No matching area found
    return { covered: false, area: null, additional_fee: 0 };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula.
   *
   * @param lat1 - Latitude of point 1
   * @param lon1 - Longitude of point 1
   * @param lat2 - Latitude of point 2
   * @param lon2 - Longitude of point 2
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
