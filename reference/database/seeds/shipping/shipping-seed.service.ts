import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingProviderEntity } from '@/shipping/persistence/entities/shipping-provider.entity';
import { ShippingMethodEntity } from '@/shipping/persistence/entities/shipping-method.entity';
import { ShippingZoneEntity } from '@/shipping/persistence/entities/shipping-zone.entity';
import { ShippingZoneAreaEntity } from '@/shipping/persistence/entities/shipping-zone-area.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProviderType, AreaType } from '@/shipping/domain/enums/shipping.enum';
import { ISeedService } from '../seed.interface';

@Injectable()
export class ShippingSeedService implements ISeedService {
  constructor(
    @InjectRepository(ShippingProviderEntity)
    private providerRepository: Repository<ShippingProviderEntity>,
    @InjectRepository(ShippingMethodEntity)
    private methodRepository: Repository<ShippingMethodEntity>,
    @InjectRepository(ShippingZoneEntity)
    private zoneRepository: Repository<ShippingZoneEntity>,
    @InjectRepository(ShippingZoneAreaEntity)
    private zoneAreaRepository: Repository<ShippingZoneAreaEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const providerCount = await this.providerRepository.count();

    if (providerCount > 0) {
      console.log('⚠️  Shipping data already exists, skipping seed');
      return;
    }

    // Get first user for audit fields
    const user = await this.userRepository.findOne({
      where: {},
      order: { id: 'ASC' },
    });

    if (!user) {
      console.error('❌ No users found. Cannot seed shipping data.');
      return;
    }

    // 1. Create In-House Delivery Provider
    const provider = await this.providerRepository.save(
      this.providerRepository.create({
        name: 'In-House Delivery',
        code: 'IN_HOUSE',
        description: 'Our own delivery service for Metro Cebu',
        provider_type: ProviderType.IN_HOUSE,
        is_active: true,
        is_default: true,
        display_order: 1,
        created_by: user,
        updated_by: user,
      }),
    );
    console.log('✅ Shipping provider created: In-House Delivery');

    // 2. Create Cebu Zone
    const zone = await this.zoneRepository.save(
      this.zoneRepository.create({
        provider_id: provider.id,
        name: 'Metro Cebu',
        description: 'Cebu City and surrounding areas',
        is_active: true,
        is_default: true,
        created_by: user,
        updated_by: user,
      }),
    );
    console.log('✅ Shipping zone created: Metro Cebu');

    // 3. Create Zone Areas (cities in Metro Cebu)
    const areas = [
      { area_type: AreaType.CITY, area_value: 'Cebu City' },
      { area_type: AreaType.CITY, area_value: 'Mandaue City' },
      { area_type: AreaType.CITY, area_value: 'Lapu-Lapu City' },
      { area_type: AreaType.CITY, area_value: 'Talisay City' },
      { area_type: AreaType.CITY, area_value: 'Consolacion' },
      { area_type: AreaType.CITY, area_value: 'Liloan' },
      { area_type: AreaType.PROVINCE, area_value: 'Cebu' }, // Fallback for province
    ];

    for (const area of areas) {
      await this.zoneAreaRepository.save(
        this.zoneAreaRepository.create({
          zone_id: zone.id,
          area_type: area.area_type,
          area_value: area.area_value,
        }),
      );
    }
    console.log(`✅ Created ${areas.length} zone areas for Metro Cebu`);

    // 4. Create Standard Delivery Method
    await this.methodRepository.save(
      this.methodRepository.create({
        provider_id: provider.id,
        name: 'Standard Delivery',
        description: 'Regular delivery within 1-3 business days',
        is_active: true,
        display_order: 1,
        // Pricing
        base_fee: 0, // ₱30 base fee
        rate_per_km: 5, // ₱5 per km
        rate_per_kg: 10, // ₱10 per kg
        minimum_fee: 30, // Minimum ₱30
        // Free shipping threshold
        free_shipping_threshold: 1000, // Free shipping over ₱1000
        free_shipping_max_weight_kg: 10, // Max 10kg for free shipping
        // Distance limits
        max_distance_km: 50, // 50km max radius
        // Dimensional weight
        volumetric_divisor: 5000, // Standard dimensional divisor
        created_by: user,
        updated_by: user,
      }),
    );
    console.log('✅ Shipping method created: Standard Delivery');
  }
}
