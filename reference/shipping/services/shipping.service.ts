import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ShippingProviderRepository } from '@/shipping/persistence/repositories/shipping-provider.repository';
import { ShippingMethodRepository } from '@/shipping/persistence/repositories/shipping-method.repository';
import { ShippingDistanceTierRepository } from '@/shipping/persistence/repositories/shipping-distance-tier.repository';
import {
  ShippingZoneRateRepository,
  ZoneRateOverride,
} from '@/shipping/persistence/repositories/shipping-zone-rate.repository';
import { DistanceCalculatorService } from './distance-calculator.service';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { ZoneResolverService } from './zone-resolver.service';
import { ShippingProvider } from '@/shipping/domain/shipping-provider';
import { ShippingMethod } from '@/shipping/domain/shipping-method';
import { ShippingDistanceTier } from '@/shipping/domain/shipping-distance-tier';
import { CreateShippingProviderDto } from '@/shipping/dto/create-shipping-provider.dto';
import { UpdateShippingProviderDto } from '@/shipping/dto/update-shipping-provider.dto';
import { CreateShippingMethodDto } from '@/shipping/dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from '@/shipping/dto/update-shipping-method.dto';
import { CreateDistanceTierDto } from '@/shipping/dto/create-distance-tier.dto';
import { UpdateDistanceTierDto } from '@/shipping/dto/update-distance-tier.dto';
import { CalculateShippingDto } from '@/shipping/dto/calculate-shipping.dto';
import { ShippingRateResponseDto } from '@/shipping/dto/shipping-rate-response.dto';
import {
  QueryShippingProviderDto,
  QueryShippingMethodDto,
} from '@/shipping/dto/query-shipping.dto';
import { User } from '@/users/domain/user';

/**
 * Main shipping service that orchestrates shipping operations
 */
@Injectable()
export class ShippingService {
  constructor(
    private readonly providerRepository: ShippingProviderRepository,
    private readonly methodRepository: ShippingMethodRepository,
    private readonly tierRepository: ShippingDistanceTierRepository,
    private readonly zoneRateRepository: ShippingZoneRateRepository,
    private readonly distanceCalculator: DistanceCalculatorService,
    private readonly shippingCalculator: ShippingCalculatorService,
    private readonly zoneResolver: ZoneResolverService,
  ) {}

  // ==================== Providers ====================

  async createProvider(
    dto: CreateShippingProviderDto,
    user: User,
  ): Promise<ShippingProvider> {
    // Check if code already exists
    const existingProvider = await this.providerRepository.findByCode(dto.code);
    if (existingProvider) {
      throw new ConflictException(
        `Shipping provider with code '${dto.code}' already exists`,
      );
    }

    // If this is set as default, clear existing defaults
    if (dto.is_default) {
      await this.providerRepository.clearDefaultFlag();
    }

    return this.providerRepository.create({
      ...dto,
      created_by: { id: user.id } as any,
      updated_by: { id: user.id } as any,
    });
  }

  async findAllProviders(
    query: QueryShippingProviderDto,
  ): Promise<{ data: ShippingProvider[]; totalCount: number }> {
    return this.providerRepository.findAll(query);
  }

  async findProviderById(id: number): Promise<ShippingProvider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException(`Shipping provider with ID ${id} not found`);
    }
    return provider;
  }

  async updateProvider(
    id: number,
    dto: UpdateShippingProviderDto,
    user: User,
  ): Promise<ShippingProvider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException(`Shipping provider with ID ${id} not found`);
    }

    // Check if code is being changed and already exists
    if (dto.code && dto.code !== provider.code) {
      const existingProvider = await this.providerRepository.findByCode(
        dto.code,
      );
      if (existingProvider) {
        throw new ConflictException(
          `Shipping provider with code '${dto.code}' already exists`,
        );
      }
    }

    // If this is being set as default, clear existing defaults
    if (dto.is_default && !provider.is_default) {
      await this.providerRepository.clearDefaultFlag();
    }

    return this.providerRepository.update(id, {
      ...dto,
      updated_by: { id: user.id } as any,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeProvider(id: number, _user: User): Promise<void> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException(`Shipping provider with ID ${id} not found`);
    }

    await this.providerRepository.remove(id);
  }

  // ==================== Methods ====================

  async createMethod(
    dto: CreateShippingMethodDto,
    user: User,
  ): Promise<ShippingMethod> {
    // Verify provider exists
    const provider = await this.providerRepository.findById(dto.provider_id);
    if (!provider) {
      throw new NotFoundException(
        `Shipping provider with ID ${dto.provider_id} not found`,
      );
    }

    return this.methodRepository.create({
      ...dto,
      created_by: { id: user.id } as any,
      updated_by: { id: user.id } as any,
    });
  }

  async findAllMethods(
    query: QueryShippingMethodDto,
  ): Promise<{ data: ShippingMethod[]; totalCount: number }> {
    return this.methodRepository.findAll(query);
  }

  async findMethodById(id: number): Promise<ShippingMethod> {
    const method = await this.methodRepository.findById(id);
    if (!method) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }
    return method;
  }

  async updateMethod(
    id: number,
    dto: UpdateShippingMethodDto,
    user: User,
  ): Promise<ShippingMethod> {
    const method = await this.methodRepository.findById(id);
    if (!method) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }

    return this.methodRepository.update(id, {
      ...dto,
      updated_by: { id: user.id } as any,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeMethod(id: number, _user: User): Promise<void> {
    const method = await this.methodRepository.findById(id);
    if (!method) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }

    await this.methodRepository.remove(id);
  }

  // ==================== Distance Tiers ====================

  async createTier(
    methodId: number,
    dto: CreateDistanceTierDto,
  ): Promise<ShippingDistanceTier> {
    // Verify method exists
    const method = await this.methodRepository.findById(methodId);
    if (!method) {
      throw new NotFoundException(
        `Shipping method with ID ${methodId} not found`,
      );
    }

    // Validate tier ranges
    if (
      dto.max_distance_km !== null &&
      dto.max_distance_km !== undefined &&
      dto.min_distance_km >= dto.max_distance_km
    ) {
      throw new BadRequestException(
        'min_distance_km must be less than max_distance_km',
      );
    }

    return this.tierRepository.create({ ...dto, method_id: methodId });
  }

  async findAllTiers(methodId?: number): Promise<ShippingDistanceTier[]> {
    return this.tierRepository.findAll(methodId);
  }

  async findTierById(id: number): Promise<ShippingDistanceTier> {
    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new NotFoundException(`Distance tier with ID ${id} not found`);
    }
    return tier;
  }

  async findTiersByMethodId(methodId: number): Promise<ShippingDistanceTier[]> {
    return this.tierRepository.findByMethodId(methodId);
  }

  async updateTier(
    id: number,
    dto: UpdateDistanceTierDto,
  ): Promise<ShippingDistanceTier> {
    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new NotFoundException(`Distance tier with ID ${id} not found`);
    }

    // Validate tier ranges if being updated
    const newMin =
      dto.min_distance_km !== undefined
        ? dto.min_distance_km
        : tier.min_distance_km;
    const newMax =
      dto.max_distance_km !== undefined
        ? dto.max_distance_km
        : tier.max_distance_km;

    if (newMax != null && newMin >= newMax) {
      throw new BadRequestException(
        'min_distance_km must be less than max_distance_km',
      );
    }

    return this.tierRepository.update(id, dto);
  }

  async removeTier(id: number): Promise<void> {
    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new NotFoundException(`Distance tier with ID ${id} not found`);
    }

    await this.tierRepository.remove(id);
  }

  // ==================== Shipping Calculation ====================

  /**
   * Calculate shipping rate for checkout
   */
  async calculateShipping(
    dto: CalculateShippingDto,
  ): Promise<ShippingRateResponseDto> {
    // Validate coordinates
    if (
      !this.distanceCalculator.isValidCoordinates(
        dto.seller_location.latitude,
        dto.seller_location.longitude,
      )
    ) {
      throw new BadRequestException('Invalid seller location coordinates');
    }

    if (
      !this.distanceCalculator.isValidCoordinates(
        dto.buyer_location.latitude,
        dto.buyer_location.longitude,
      )
    ) {
      throw new BadRequestException('Invalid buyer location coordinates');
    }

    // Get shipping method - either specified or default
    let method;
    let provider;

    if (dto.shipping_method_id) {
      // Use specified method
      method = await this.methodRepository.findById(dto.shipping_method_id);
      if (!method) {
        throw new NotFoundException(
          `Shipping method with ID ${dto.shipping_method_id} not found`,
        );
      }
      if (!method.is_active) {
        throw new BadRequestException(
          `Shipping method '${method.name}' is not available`,
        );
      }
      provider = await this.providerRepository.findById(method.provider_id);
    } else {
      // Get default provider and its first active method
      provider = await this.providerRepository.findDefault();
      if (!provider) {
        throw new NotFoundException(
          'No default shipping provider configured. Please contact administrator.',
        );
      }

      const methods = await this.methodRepository.findActiveByProviderId(
        provider.id,
      );
      if (methods.length === 0) {
        throw new NotFoundException(
          'No active shipping methods available. Please contact administrator.',
        );
      }

      // Use the first active method (sorted by display_order)
      method = methods[0];
    }

    // Calculate distance
    const distanceKm = this.distanceCalculator.calculateDistance(
      dto.seller_location.latitude,
      dto.seller_location.longitude,
      dto.buyer_location.latitude,
      dto.buyer_location.longitude,
    );

    // Resolve zone and apply zone-specific rates if buyer address is provided
    let zoneId: number | null = null;
    let zoneName: string | null = null;
    let effectiveMethod = method;

    if (dto.buyer_address && provider) {
      const zone = await this.zoneResolver.resolveZone(
        provider.id,
        dto.buyer_address,
      );

      if (zone) {
        zoneId = zone.id;
        zoneName = zone.name;

        // Get zone-specific rate overrides
        const zoneRates = await this.zoneRateRepository.findByMethodAndZone(
          method.id,
          zone.id,
        );

        if (zoneRates) {
          // Apply zone overrides to create effective method
          effectiveMethod = this.applyZoneRates(method, zoneRates);
        }
      }
    }

    // Check max distance limit (using effective method's limit)
    if (
      effectiveMethod.max_distance_km != null &&
      distanceKm > effectiveMethod.max_distance_km
    ) {
      throw new BadRequestException(
        `Delivery distance (${distanceKm}km) exceeds maximum service area (${effectiveMethod.max_distance_km}km)`,
      );
    }

    // Calculate shipping using effective method (with zone overrides applied)
    const result = this.shippingCalculator.calculate({
      method: effectiveMethod,
      distanceKm,
      items: dto.items,
      subtotal: dto.subtotal,
    });

    return {
      shipping_amount: result.shipping_amount,
      distance_km: distanceKm,
      chargeable_weight_kg: result.chargeable_weight_kg,
      is_free_shipping: result.is_free_shipping,
      method_id: method.id,
      method_name: method.name,
      provider_id: provider?.id,
      provider_name: provider?.name,
      zone_id: zoneId,
      zone_name: zoneName,
      breakdown: result.breakdown,
    };
  }

  /**
   * Apply zone-specific rate overrides to a shipping method
   * Returns a new method object with overridden values (null = use method default)
   */
  private applyZoneRates(
    method: ShippingMethod,
    zoneRates: ZoneRateOverride,
  ): ShippingMethod {
    return {
      ...method,
      base_fee: zoneRates.base_fee ?? method.base_fee,
      rate_per_km: zoneRates.rate_per_km ?? method.rate_per_km,
      rate_per_kg: zoneRates.rate_per_kg ?? method.rate_per_kg,
      max_distance_km: zoneRates.max_distance_km ?? method.max_distance_km,
      minimum_fee: zoneRates.minimum_fee ?? method.minimum_fee,
      free_shipping_threshold:
        zoneRates.free_shipping_threshold ?? method.free_shipping_threshold,
    };
  }

  /**
   * Get default shipping provider
   */
  async getDefaultProvider(): Promise<ShippingProvider | null> {
    return this.providerRepository.findDefault();
  }

  /**
   * Get available shipping methods for checkout
   * Returns all active methods from all active providers
   */
  async getAvailableMethods(): Promise<
    Array<{
      id: number;
      name: string;
      description: string | null;
      base_fee: number;
      free_shipping_threshold: number | null;
      estimated_days: string;
      provider_id: number;
      provider_name: string;
    }>
  > {
    const { data: providers } = await this.providerRepository.findAll({
      is_active: true,
    });

    if (providers.length === 0) {
      return [];
    }

    const allMethods: Array<{
      id: number;
      name: string;
      description: string | null;
      base_fee: number;
      free_shipping_threshold: number | null;
      estimated_days: string;
      provider_id: number;
      provider_name: string;
    }> = [];

    for (const provider of providers) {
      const methods = await this.methodRepository.findActiveByProviderId(
        provider.id,
      );

      for (const method of methods) {
        allMethods.push({
          id: method.id,
          name: method.name,
          description: method.description ?? null,
          base_fee: method.base_fee,
          free_shipping_threshold: method.free_shipping_threshold ?? null,
          estimated_days: method.name.toLowerCase().includes('express')
            ? 'Same day'
            : '1-3 business days',
          provider_id: provider.id,
          provider_name: provider.name,
        });
      }
    }

    return allMethods;
  }
}
