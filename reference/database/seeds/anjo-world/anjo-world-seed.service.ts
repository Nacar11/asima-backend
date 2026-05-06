import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { StorageService } from '@/storage/storage.service';
import * as fs from 'fs/promises';
import { join } from 'path';

/** MinIO object key base for Ulrak seeded images. */
const ULRAK_IMAGE_BASE = 'media/sellers/ulrak-pickle-ball-hub/images/originals';

/**
 * Seeds Anjo World — an amusement park in Minglanilla, Cebu.
 *
 * Creates one merchant: Ulrak Pickle Ball Hub with 2 pickleball courts (A & B).
 * Each court is a VENUE service at 500 PHP/hour, operating 8 AM – 12 AM daily.
 */
@Injectable()
export class AnjoWorldSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(SellerScheduleEntity)
    private sellerScheduleRepository: Repository<SellerScheduleEntity>,
    @InjectRepository(ServiceCategoryEntity)
    private serviceCategoryRepository: Repository<ServiceCategoryEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(ServiceAreaEntity)
    private serviceAreaRepository: Repository<ServiceAreaEntity>,
    @InjectRepository(ServiceGalleryEntity)
    private serviceGalleryRepository: Repository<ServiceGalleryEntity>,
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
    @InjectRepository(UserAddressEntity)
    private userAddressRepository: Repository<UserAddressEntity>,
    private storageService: StorageService,
  ) {}

  private async uploadUlrakSeedImages(): Promise<void> {
    const assets: Array<{ fileName: string; contentType: string }> = [
      { fileName: 'ulrak-logo.png', contentType: 'image/png' },
      { fileName: 'ulrak-banner.png', contentType: 'image/png' },
      { fileName: 'pickleball-court-1.jpg', contentType: 'image/jpeg' },
      { fileName: 'pickleball-court-2.jpg', contentType: 'image/jpeg' },
      { fileName: 'standard.jpeg', contentType: 'image/jpeg' },
      { fileName: 'premium.jpeg', contentType: 'image/jpeg' },
    ];

    for (const asset of assets) {
      const sourcePath = join(
        process.cwd(),
        'public',
        'images',
        asset.fileName,
      );
      const objectKey = `${ULRAK_IMAGE_BASE}/${asset.fileName}`;

      try {
        const buffer = await fs.readFile(sourcePath);
        await this.storageService.putBuffer(
          buffer,
          objectKey,
          asset.contentType,
        );
        console.log(`✅ Uploaded Ulrak seed image: ${objectKey}`);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.warn(`⚠️  Missing Ulrak seed image file: ${sourcePath}`);
          continue;
        }
        console.warn(
          `⚠️  Failed to upload Ulrak seed image (${objectKey}): ${err.message}`,
        );
      }
    }
  }

  async run(): Promise<void> {
    // Find the Store Owner user (owner@cody.inc)
    const storeOwner = await this.userRepository.findOne({
      where: { email: 'owner@cody.inc' },
    });

    if (!storeOwner) {
      console.log(
        '⚠️  Store Owner user (owner@cody.inc) not found. Skipping Anjo World seed.',
      );
      return;
    }

    // Check if seller already exists for this user
    let seller = await this.sellerRepository.findOne({
      where: { user_id: storeOwner.id },
    });

    // Get PHP currency
    const phpCurrency = await this.currencyRepository.findOne({
      where: { code: 'PHP' },
    });

    if (!phpCurrency) {
      console.log('⚠️  PHP currency not found. Skipping Anjo World seed.');
      return;
    }

    // Upload static Ulrak images from backend/seed-images/anjo into MinIO.
    await this.uploadUlrakSeedImages();

    // === 0. Ensure walk-in address exists for Ulrak (Anjo World, Minglanilla) ===
    const walkInLabel = 'Walk-in location (Ulrak)';
    let walkInAddress = await this.userAddressRepository.findOne({
      where: {
        user_id: storeOwner.id,
        label: walkInLabel,
      },
    });
    if (!walkInAddress) {
      walkInAddress = await this.userAddressRepository.save(
        this.userAddressRepository.create({
          user_id: storeOwner.id,
          label: walkInLabel,
          recipient_name: `${storeOwner.first_name} ${storeOwner.last_name}`,
          phone: '+63 919 069 2100',
          address_line1: 'Ulrak Pickle Ball Hub, Upper Belmont One, South Road',
          address_line2: 'Calajo-an, Anjo World',
          city: 'Minglanilla',
          state_province: 'Cebu',
          postal_code: '6046',
          country: 'Philippines',
          is_default: false,
          latitude: 10.2356,
          longitude: 123.7994,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      console.log(`✅ Ulrak walk-in address created (id: ${walkInAddress.id})`);
    }

    // === 1. Create Seller ===
    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          id: 4,
          user_id: storeOwner.id,
          store_name: 'Ulrak Pickle Ball Hub',
          slug: 'ulrak-pickle-ball-hub',
          store_description:
            'Ulrak Pickle Ball Hub is a premier pickleball facility located inside Anjo World, Belmont One, Minglanilla, Cebu. Featuring two full-size regulation courts with proper lighting and ventilation. Open daily from 8 AM to midnight.',
          store_logo_url: `${ULRAK_IMAGE_BASE}/ulrak-logo.png`,
          store_banner_url: `${ULRAK_IMAGE_BASE}/ulrak-banner.png`,
          business_registration_number: 'REG-2026-ULRK-001',
          business_type: null,
          tax_id: 'TIN-2026-ULRK-001',
          is_verified: true,
          is_active: true,
          sells_products: false,
          sells_services: true,
          auto_accept_bookings: false,
          bio: 'Ulrak Pickle Ball Hub — your go-to pickleball destination at Anjo World, Minglanilla. Two courts, open daily 8 AM to midnight.',
          years_of_experience: 2,
          hourly_rate: 500.0,
          max_concurrent_bookings: 2,
          max_daily_bookings: 32,
          service_capacity_hours: 16.0,
          status: StatusEnum.ACTIVE,
          pickup_address:
            'Ulrak Pickle Ball Hub, Upper Belmont One, South Road, Minglanilla',
          pickup_city: 'Minglanilla',
          pickup_province: 'Cebu',
          pickup_postal_code: '6046',
          pickup_latitude: 10.2356,
          pickup_longitude: 123.7994,
          service_location_address_id: walkInAddress.id,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      console.log('✅ Ulrak Pickle Ball Hub seller created (ID: 4)');
    } else {
      await this.sellerRepository.save({
        ...seller,
        store_name: 'Ulrak Pickle Ball Hub',
        slug: 'ulrak-pickle-ball-hub',
        store_description:
          'Ulrak Pickle Ball Hub is a premier pickleball facility located inside Anjo World, Belmont One, Minglanilla, Cebu. Featuring two full-size regulation courts with proper lighting and ventilation. Open daily from 8 AM to midnight.',
        store_logo_url: `${ULRAK_IMAGE_BASE}/ulrak-logo.png`,
        store_banner_url: `${ULRAK_IMAGE_BASE}/ulrak-banner.png`,
        bio: 'Ulrak Pickle Ball Hub — your go-to pickleball destination at Anjo World, Minglanilla. Two courts, open daily 8 AM to midnight.',
        sells_products: false,
        sells_services: true,
        years_of_experience: 2,
        pickup_address:
          'Ulrak Pickle Ball Hub, Upper Belmont One, South Road, Minglanilla',
        pickup_city: 'Minglanilla',
        pickup_province: 'Cebu',
        pickup_postal_code: '6046',
        pickup_latitude: 10.2356,
        pickup_longitude: 123.7994,
        service_location_address_id: walkInAddress.id,
        updated_by: storeOwner,
      });
      console.log(
        `✅ Seller already exists (ID: ${seller.id}). Updated with Ulrak Pickle Ball Hub info and walk-in location.`,
      );
    }

    // === 2. Create Seller Schedules (Mon–Sun, 8 AM – 12 AM, no breaks) ===
    const existingSchedulesCount = await this.sellerScheduleRepository.count({
      where: { seller_id: seller.id },
    });

    if (existingSchedulesCount === 0) {
      const schedules: Array<{
        seller_id: number;
        day_of_week: number;
        status: string;
        start_time: string;
        end_time: string;
        break_start: string | null;
        break_end: string | null;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // Open 7 days a week (0 = Sunday through 6 = Saturday)
      // end_time 24:00:00 = midnight (end of day); 00:00:00 would be 0 min and yield no slots
      for (let day = 0; day <= 6; day++) {
        schedules.push({
          seller_id: seller.id,
          day_of_week: day,
          status: 'Active',
          start_time: '08:00:00',
          end_time: '24:00:00',
          break_start: null,
          break_end: null,
          created_by: storeOwner,
          updated_by: storeOwner,
        });
      }

      await this.sellerScheduleRepository.save(
        schedules.map((s) => this.sellerScheduleRepository.create(s)),
      );
      console.log('✅ 7 seller schedules created (Mon–Sun 8AM–12AM, no break)');
    } else {
      // Fix end_time if it was 00:00:00 (yields no slots); use 24:00:00 for midnight
      const existingSchedules = await this.sellerScheduleRepository.find({
        where: { seller_id: seller.id },
      });
      const broken = existingSchedules.filter((s) => s.end_time === '00:00:00');
      if (broken.length > 0) {
        for (const s of broken) {
          await this.sellerScheduleRepository.update(s.id, {
            end_time: '24:00:00',
          });
        }
        console.log(
          `✅ Fixed ${broken.length} seller schedule(s): end_time 00:00:00 → 24:00:00`,
        );
      } else {
        console.log('⚠️  Seller schedules already exist. Skipping.');
      }
    }

    // === 3. Get Service Categories ===
    const racketSportsCat = await this.serviceCategoryRepository.findOne({
      where: { code: 'racket-sports' },
    });

    if (!racketSportsCat) {
      console.log(
        '⚠️  racket-sports service category not found. Run service-categories seed first.',
      );
      return;
    }

    // === 4. Create Services (2 pickleball courts) ===
    const existingServicesCount = await this.serviceRepository.count({
      where: { seller_id: seller.id },
    });

    const services: ServiceEntity[] = [];

    if (existingServicesCount > 0) {
      console.log(
        '⚠️  Services already exist for this seller. Fetching existing.',
      );
      const existing = await this.serviceRepository.find({
        where: { seller_id: seller.id },
      });
      services.push(...existing);
    } else {
      // 1. Pickleball Court A
      const courtA = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: racketSportsCat.id,
          currency_id: phpCurrency.id,
          title: 'Pickleball Court 2',
          code: 'ulrak-pickleball-court-2',
          description:
            'Book Pickleball Court 2 at Ulrak Pickle Ball Hub inside Anjo World, Minglanilla. Full-size regulation court with proper lighting and ventilation. Equipment rental available on-site.',
          short_description: 'Pickleball Court 2 — hourly rental',
          pricing_type: PricingTypeEnum.HOURLY,
          base_price: 500.0,
          hourly_rate: 500.0,
          estimated_duration_minutes: 60,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 240,
          service_radius_km: null,
          is_remote_available: false,
          max_bookings_per_day: null,
          advance_booking_days: 14,
          minimum_notice_hours: 2,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.VENUE,
          service_location_type: ServiceLocationTypeEnum.WALK_IN,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          venue_capacity: 1,
          slot_duration_minutes: 60,
          peak_price_multiplier: null,
          peak_days: null,
          peak_start_time: null,
          peak_end_time: null,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(courtA);

      // 2. Pickleball Court B
      const courtB = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: racketSportsCat.id,
          currency_id: phpCurrency.id,
          title: 'Pickleball Court 1',
          code: 'ulrak-pickleball-court-1',
          description:
            'Book Pickleball Court 1 at Ulrak Pickle Ball Hub inside Anjo World, Minglanilla. Full-size regulation court with proper lighting and ventilation. Equipment rental available on-site.',
          short_description: 'Pickleball Court 1 — hourly rental',
          pricing_type: PricingTypeEnum.HOURLY,
          base_price: 500.0,
          hourly_rate: 500.0,
          estimated_duration_minutes: 60,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 240,
          service_radius_km: null,
          is_remote_available: false,
          max_bookings_per_day: null,
          advance_booking_days: 14,
          minimum_notice_hours: 2,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.VENUE,
          service_location_type: ServiceLocationTypeEnum.WALK_IN,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          venue_capacity: 1,
          slot_duration_minutes: 60,
          peak_price_multiplier: null,
          peak_days: null,
          peak_start_time: null,
          peak_end_time: null,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(courtB);

      console.log(
        `✅ ${services.length} Ulrak Pickle Ball Hub services created`,
      );
    }

    if (services.length === 0) {
      console.log('⚠️  No services found. Skipping dependent data.');
      return;
    }

    // === 5. Create Service Areas ===
    const existingAreasCount = await this.serviceAreaRepository.count({
      where: { seller_id: seller.id },
    });

    if (existingAreasCount > 0) {
      console.log('⚠️  Service areas already exist. Skipping.');
    } else {
      const serviceAreas: Array<{
        seller_id: number;
        service_id: number;
        city: string;
        province: string;
        postal_code: string | null;
        barangay: string | null;
        center_latitude: number;
        center_longitude: number;
        radius_km: number;
        additional_fee: number;
        additional_fee_type: AdditionalFeeTypeEnum;
        minimum_order_amount: number | null;
        status: string;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      for (const service of services) {
        // Minglanilla (home base) — no fee
        serviceAreas.push({
          seller_id: seller.id,
          service_id: service.id,
          city: 'Minglanilla',
          province: 'Cebu',
          postal_code: '6046',
          barangay: 'Calajo-an',
          center_latitude: 10.2356,
          center_longitude: 123.7994,
          radius_km: 10,
          additional_fee: 0,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: null,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        });
      }

      await this.serviceAreaRepository.save(
        serviceAreas.map((a) => this.serviceAreaRepository.create(a)),
      );
      console.log(
        `✅ ${serviceAreas.length} service areas created (1 per service)`,
      );
    }

    // === 6. Upsert Service Gallery Images (MinIO object keys) ===
    let createdGalleryCount = 0;
    let updatedGalleryCount = 0;

    for (const service of services) {
      const existingPrimary = await this.serviceGalleryRepository.findOne({
        where: { service_id: service.id, is_primary: true },
      });

      const targetCaption = service.title;
      const targetAltText = service.short_description || service.title;

      const perServiceImageMap: Record<string, string> = {
        'ulrak-pickleball-court-1': 'pickleball-court-1.jpg',
        'ulrak-pickleball-court-2': 'pickleball-court-2.jpg',
      };
      const isPremium =
        service.code === 'ulrak-pickleball-court-premium' ||
        service.title.toLowerCase().includes('premium');
      const imageFileName =
        perServiceImageMap[service.code] ??
        (isPremium ? 'premium.jpeg' : 'standard.jpeg');
      const galleryImageKey = `${ULRAK_IMAGE_BASE}/${imageFileName}`;

      if (!existingPrimary) {
        await this.serviceGalleryRepository.save(
          this.serviceGalleryRepository.create({
            service_id: service.id,
            image_url: galleryImageKey,
            caption: targetCaption,
            alt_text: targetAltText,
            is_primary: true,
            display_order: 0,
            status: 'Active',
            created_by: storeOwner,
            updated_by: storeOwner,
          }),
        );
        createdGalleryCount++;
        continue;
      }

      const shouldUpdate =
        existingPrimary.image_url !== galleryImageKey ||
        (existingPrimary.caption ?? null) !== targetCaption ||
        (existingPrimary.alt_text ?? null) !== targetAltText ||
        existingPrimary.display_order !== 0 ||
        existingPrimary.status !== 'Active';

      if (!shouldUpdate) {
        continue;
      }

      await this.serviceGalleryRepository.save({
        ...existingPrimary,
        image_url: galleryImageKey,
        caption: targetCaption,
        alt_text: targetAltText,
        display_order: 0,
        status: 'Active',
        updated_by: storeOwner,
      });
      updatedGalleryCount++;
    }

    console.log(
      `✅ Service gallery upserted (created: ${createdGalleryCount}, updated: ${updatedGalleryCount})`,
    );

    console.log(
      '✅ Anjo World (Ulrak Pickle Ball Hub) seed completed successfully',
    );
  }
}
