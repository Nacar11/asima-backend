import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceAreaRepository } from '@/service-areas/persistence/base-service-area.repository';
import { CreateServiceAreaDto } from '@/service-areas/dto/create-service-area.dto';
import { UpdateServiceAreaDto } from '@/service-areas/dto/update-service-area.dto';
import { QueryServiceAreaDto } from '@/service-areas/dto/query-service-area.dto';
import {
  CheckLocationCoverageDto,
  LocationCoverageResponseDto,
} from '@/service-areas/dto/check-location-coverage.dto';
import { ServiceArea } from '@/service-areas/domain/service-area';
import { ServicesService } from '@/services/services.service';
import { SellersService } from '@/sellers/sellers.service';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { User } from '@/users/domain/user';

@Injectable()
export class ServiceAreasService {
  constructor(
    private readonly repository: BaseServiceAreaRepository,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    @Inject(forwardRef(() => SellersService))
    private readonly sellersService: SellersService,
  ) {}

  private ensureLocation(dto: CreateServiceAreaDto | UpdateServiceAreaDto) {
    const hasArea =
      dto.city ||
      dto.province ||
      dto.postal_code ||
      dto.barangay ||
      dto.center_latitude !== undefined ||
      dto.center_longitude !== undefined ||
      dto.radius_km !== undefined;
    if (!hasArea) {
      throw new BadRequestException(
        'At least one of city, province, postal_code, barangay, or center/radius must be provided',
      );
    }
  }

  async create(dto: CreateServiceAreaDto, causer: User) {
    // Validate seller exists
    await this.sellersService.findById(dto.seller_id);
    this.ensureLocation(dto);

    const area = Object.assign(new ServiceArea(), dto, {
      center_latitude: dto.center_latitude ?? null,
      center_longitude: dto.center_longitude ?? null,
      radius_km: dto.radius_km ?? null,
      additional_fee: dto.additional_fee_amount ?? 0,
      additional_fee_amount: dto.additional_fee_amount ?? null,
      additional_fee_type:
        dto.additional_fee_type ?? AdditionalFeeTypeEnum.NONE,
      minimum_order_amount: dto.minimum_order_amount ?? null,
      status: dto.status ?? 'Active',
      is_active: dto.is_active ?? true,
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(area);
  }

  async findAll(query: QueryServiceAreaDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const area = await this.repository.findById(id);
    if (!area) throw new NotFoundException('Service Area not found');
    return area;
  }

  async update(id: number, dto: UpdateServiceAreaDto, causer: User) {
    const existing = await this.findById(id);
    if (dto.seller_id && dto.seller_id !== existing.seller_id) {
      await this.sellersService.findById(dto.seller_id);
    }
    if (
      dto.city !== undefined ||
      dto.province !== undefined ||
      dto.postal_code !== undefined ||
      dto.barangay !== undefined ||
      dto.center_latitude !== undefined ||
      dto.center_longitude !== undefined ||
      dto.radius_km !== undefined
    ) {
      this.ensureLocation(dto);
    }

    return this.repository.update(id, {
      ...dto,
      additional_fee: dto.additional_fee_amount ?? existing.additional_fee,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  /**
   * Check if a location is covered by a service's defined service areas.
   *
   * Matching priority:
   * 1. Postal code (exact match)
   * 2. City + Province (exact match)
   * 3. Radius (within defined radius_km using Haversine formula)
   * 4. Fallback: service_radius_km from seller location (if no service areas defined)
   *
   * If no service areas are defined for the service and no fallback radius check is possible,
   * returns covered=true (assumes global coverage).
   *
   * @param dto - Location details to check
   * @returns Coverage result with optional additional fees
   */
  async checkLocationCoverage(
    dto: CheckLocationCoverageDto,
  ): Promise<LocationCoverageResponseDto> {
    // Verify service exists and get service details for fallback
    const service = await this.servicesService.findById(dto.service_id);

    // Get seller coordinates for fallback radius check
    let sellerLatitude: number | undefined;
    let sellerLongitude: number | undefined;

    try {
      const seller = await this.sellersService.findById(service.seller_id);
      sellerLatitude = seller.pickup_latitude ?? undefined;
      sellerLongitude = seller.pickup_longitude ?? undefined;
    } catch {
      // Seller lookup failed, continue without seller coordinates
    }

    const result = await this.repository.checkLocationCoverage({
      service_id: dto.service_id,
      city: dto.city,
      province: dto.province,
      postal_code: dto.postal_code,
      latitude: dto.latitude,
      longitude: dto.longitude,
      // Pass service_radius_km as fallback for distance check
      service_radius_km: service.service_radius_km ?? undefined,
      seller_latitude: sellerLatitude,
      seller_longitude: sellerLongitude,
    });

    return {
      covered: result.covered,
      reason: result.covered
        ? undefined
        : 'Service is not available in the specified location',
      additional_fee: result.additional_fee,
      additional_fee_type: result.area?.additional_fee_type,
    };
  }
}
