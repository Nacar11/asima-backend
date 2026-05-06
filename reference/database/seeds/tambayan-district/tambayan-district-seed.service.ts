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
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { StorageService } from '@/storage/storage.service';
import * as fs from 'fs/promises';
import { join } from 'path';

const TAMBAYAN_IMAGE_BASE = 'media/sellers/tambayan-district/images/originals';
const TAMBAYAN_OWNER_EMAIL = 'mike.johnson@cody.inc';
const TAMBAYAN_SELLER_SLUG = 'tambayan-district';
const TAMBAYAN_WALK_IN_LABEL = 'Walk-in location (Tambayan District)';

const TAMBAYAN_COURTS: Array<{
  courtNumber: number;
  code: string;
  imageFileName: string;
}> = Array.from({ length: 8 }, (_, index) => ({
  courtNumber: index + 1,
  code: `tambayan-pickleball-court-${index + 1}`,
  imageFileName: index % 2 === 0 ? 'standard.jpeg' : 'premium.jpeg',
}));

@Injectable()
export class TambayanDistrictSeedService implements ISeedService {
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

  private async withTimeout<T>(
    task: Promise<T>,
    timeoutMs: number,
    label: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      return await Promise.race([task, timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async uploadTambayanSeedImages(): Promise<void> {
    const assets: Array<{ fileName: string; contentType: string }> = [
      { fileName: 'pickleball-court.png', contentType: 'image/png' },
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
      const objectKey = `${TAMBAYAN_IMAGE_BASE}/${asset.fileName}`;

      try {
        const buffer = await fs.readFile(sourcePath);
        await this.withTimeout(
          this.storageService.putBuffer(buffer, objectKey, asset.contentType),
          10000,
          `Uploading ${objectKey}`,
        );
        console.log(`✅ Uploaded Tambayan seed image: ${objectKey}`);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.warn(`⚠️  Missing Tambayan seed image file: ${sourcePath}`);
          continue;
        }

        console.warn(
          `⚠️  Failed to upload Tambayan seed image (${objectKey}): ${err.message}`,
        );
      }
    }
  }

  private async resolveTambayanOwner(): Promise<UserEntity | null> {
    const explicitOwner = await this.userRepository.findOne({
      where: { email: TAMBAYAN_OWNER_EMAIL },
    });

    if (explicitOwner) {
      return explicitOwner;
    }

    const fallbackOwnerWithoutSeller = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin(SellerEntity, 'seller', 'seller.user_id = user.id')
      .where('seller.id IS NULL')
      .orderBy('user.id', 'ASC')
      .getOne();

    if (fallbackOwnerWithoutSeller) {
      console.warn(
        `⚠️  Tambayan owner email (${TAMBAYAN_OWNER_EMAIL}) not found. Using fallback user without seller: ${fallbackOwnerWithoutSeller.email} (id: ${fallbackOwnerWithoutSeller.id}).`,
      );
      return fallbackOwnerWithoutSeller;
    }

    const [fallbackAnyUser] = await this.userRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    if (fallbackAnyUser) {
      console.warn(
        `⚠️  Tambayan owner email (${TAMBAYAN_OWNER_EMAIL}) not found and no seller-free user is available. Using fallback user: ${fallbackAnyUser.email} (id: ${fallbackAnyUser.id}).`,
      );
      return fallbackAnyUser;
    }

    return null;
  }

  async run(): Promise<void> {
    const tambayanOwner = await this.resolveTambayanOwner();

    if (!tambayanOwner) {
      console.log(
        `⚠️  No users available for Tambayan District seed (owner email: ${TAMBAYAN_OWNER_EMAIL}). Skipping Tambayan District seed.`,
      );
      return;
    }

    const phpCurrency = await this.currencyRepository.findOne({
      where: { code: 'PHP' },
    });

    if (!phpCurrency) {
      console.log(
        '⚠️  PHP currency not found. Skipping Tambayan District seed.',
      );
      return;
    }

    await this.uploadTambayanSeedImages();

    let walkInAddress = await this.userAddressRepository.findOne({
      where: {
        user_id: tambayanOwner.id,
        label: TAMBAYAN_WALK_IN_LABEL,
      },
    });

    if (!walkInAddress) {
      walkInAddress = await this.userAddressRepository.save(
        this.userAddressRepository.create({
          user_id: tambayanOwner.id,
          label: TAMBAYAN_WALK_IN_LABEL,
          recipient_name: `${tambayanOwner.first_name} ${tambayanOwner.last_name}`,
          phone: '+63 917 456 7890',
          address_line1: 'Tambayan District, Basak-Marigondon Road',
          address_line2: 'Basak',
          city: 'Lapu-Lapu City',
          state_province: 'Cebu',
          postal_code: '6015',
          country: 'Philippines',
          is_default: false,
          latitude: 10.3103,
          longitude: 123.9494,
          created_by: tambayanOwner,
          updated_by: tambayanOwner,
        }),
      );
      console.log(
        `✅ Tambayan walk-in address created (id: ${walkInAddress.id})`,
      );
    }

    const existingSellerBySlug = await this.sellerRepository.findOne({
      where: { slug: TAMBAYAN_SELLER_SLUG },
    });
    const existingSellerByUser = await this.sellerRepository.findOne({
      where: { user_id: tambayanOwner.id },
    });

    if (
      existingSellerBySlug &&
      existingSellerBySlug.user_id !== tambayanOwner.id
    ) {
      console.warn(
        `⚠️  Seller slug "${TAMBAYAN_SELLER_SLUG}" already belongs to another user (user_id=${existingSellerBySlug.user_id}). Skipping Tambayan District seed to avoid overwriting unrelated data.`,
      );
      return;
    }

    let seller = existingSellerBySlug ?? existingSellerByUser ?? null;

    if (
      seller &&
      seller.slug !== TAMBAYAN_SELLER_SLUG &&
      seller.user_id === tambayanOwner.id
    ) {
      console.warn(
        `⚠️  Fallback owner (user_id=${tambayanOwner.id}) already has a different seller (id=${seller.id}, slug=${seller.slug}). Skipping Tambayan District seed to avoid overwriting unrelated data.`,
      );
      return;
    }

    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          user_id: tambayanOwner.id,
          store_name: 'Tambayan District',
          slug: TAMBAYAN_SELLER_SLUG,
          store_description:
            'Tambayan District Pickleball Hub is a dedicated eight-court pickleball venue in Basak, Lapu-Lapu City. The venue is designed for casual games, training sessions, and competitive matches, with hourly court reservations available daily.',
          store_logo_url: `${TAMBAYAN_IMAGE_BASE}/pickleball-court.png`,
          store_banner_url: `${TAMBAYAN_IMAGE_BASE}/standard.jpeg`,
          business_registration_number: 'REG-2026-TAMB-001',
          business_type: null,
          tax_id: 'TIN-2026-TAMB-001',
          contact: '0917 456 7890',
          email: 'tambayan@example.com',
          is_verified: true,
          is_active: true,
          sells_products: false,
          sells_services: true,
          auto_accept_bookings: false,
          bio: 'Tambayan District Pickleball Hub in Basak, Lapu-Lapu City. Eight bookable pickleball courts for hourly reservations.',
          years_of_experience: 2,
          hourly_rate: 500.0,
          max_concurrent_bookings: 8,
          max_daily_bookings: 128,
          service_capacity_hours: 16.0,
          status: StatusEnum.ACTIVE,
          pickup_address: 'Tambayan District, Basak-Marigondon Road, Basak',
          pickup_city: 'Lapu-Lapu City',
          pickup_province: 'Cebu',
          pickup_postal_code: '6015',
          pickup_latitude: 10.3103,
          pickup_longitude: 123.9494,
          service_location_address_id: walkInAddress.id,
          created_by: tambayanOwner,
          updated_by: tambayanOwner,
        }),
      );
      console.log(`✅ Tambayan District seller created (ID: ${seller.id})`);
    } else {
      seller = await this.sellerRepository.save({
        ...seller,
        user_id: tambayanOwner.id,
        store_name: 'Tambayan District',
        slug: TAMBAYAN_SELLER_SLUG,
        store_description:
          'Tambayan District Pickleball Hub is a dedicated eight-court pickleball venue in Basak, Lapu-Lapu City. The venue is designed for casual games, training sessions, and competitive matches, with hourly court reservations available daily.',
        store_logo_url: `${TAMBAYAN_IMAGE_BASE}/pickleball-court.png`,
        store_banner_url: `${TAMBAYAN_IMAGE_BASE}/standard.jpeg`,
        contact: '0917 456 7890',
        email: 'tambayan@example.com',
        is_verified: true,
        is_active: true,
        sells_products: false,
        sells_services: true,
        auto_accept_bookings: false,
        bio: 'Tambayan District Pickleball Hub in Basak, Lapu-Lapu City. Eight bookable pickleball courts for hourly reservations.',
        years_of_experience: 2,
        hourly_rate: 500.0,
        max_concurrent_bookings: 8,
        max_daily_bookings: 128,
        service_capacity_hours: 16.0,
        status: StatusEnum.ACTIVE,
        pickup_address: 'Tambayan District, Basak-Marigondon Road, Basak',
        pickup_city: 'Lapu-Lapu City',
        pickup_province: 'Cebu',
        pickup_postal_code: '6015',
        pickup_latitude: 10.3103,
        pickup_longitude: 123.9494,
        service_location_address_id: walkInAddress.id,
        updated_by: tambayanOwner,
      });
      console.log(
        `✅ Seller already exists (ID: ${seller.id}). Updated with Tambayan District pickleball venue info.`,
      );
    }

    const existingSchedules = await this.sellerScheduleRepository.find({
      where: { seller_id: seller.id },
      order: { day_of_week: 'ASC' },
    });
    const schedulesByDay = new Map(
      existingSchedules.map((schedule) => [schedule.day_of_week, schedule]),
    );

    for (let day = 0; day <= 6; day++) {
      const existingSchedule = schedulesByDay.get(day);

      if (!existingSchedule) {
        await this.sellerScheduleRepository.save(
          this.sellerScheduleRepository.create({
            seller_id: seller.id,
            day_of_week: day,
            status: 'Active',
            start_time: '08:00:00',
            end_time: '24:00:00',
            break_start: null,
            break_end: null,
            created_by: tambayanOwner,
            updated_by: tambayanOwner,
          }),
        );
        continue;
      }

      await this.sellerScheduleRepository.save({
        ...existingSchedule,
        status: 'Active',
        start_time: '08:00:00',
        end_time: '24:00:00',
        break_start: null,
        break_end: null,
        updated_by: tambayanOwner,
      });
    }
    console.log('✅ Tambayan seller schedules ensured (Mon–Sun 8AM–12AM)');

    const racketSportsCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'racket-sports' },
    });

    if (!racketSportsCategory) {
      console.log(
        '⚠️  racket-sports service category not found. Run service-categories seed first.',
      );
      return;
    }

    const targetServiceCodes = new Set(
      TAMBAYAN_COURTS.map((court) => court.code),
    );
    const existingVenueServices = await this.serviceRepository.find({
      where: {
        seller_id: seller.id,
        service_type: ServiceTypeEnum.VENUE,
      },
      order: { id: 'ASC' },
    });

    for (const existingService of existingVenueServices) {
      if (targetServiceCodes.has(existingService.code)) {
        continue;
      }

      await this.serviceRepository.save({
        ...existingService,
        status: ServiceStatusEnum.ARCHIVED,
        updated_by: tambayanOwner,
      });
    }

    const services: ServiceEntity[] = [];
    for (const court of TAMBAYAN_COURTS) {
      const existingService = await this.serviceRepository.findOne({
        where: { code: court.code },
      });

      const payload = {
        seller_id: seller.id,
        category_id: racketSportsCategory.id,
        currency_id: phpCurrency.id,
        title: `Pickleball Court ${court.courtNumber}`,
        code: court.code,
        description: `Book Pickleball Court ${court.courtNumber} at Tambayan District in Basak, Lapu-Lapu City. Full-size regulation court with hourly booking, court lighting, and venue staff on site.`,
        short_description: `Pickleball Court ${court.courtNumber} — hourly rental`,
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
        is_featured: court.courtNumber <= 4,
        requires_quote: false,
        instant_booking: true,
        venue_capacity: 1,
        slot_duration_minutes: 60,
        peak_price_multiplier: null,
        peak_days: null,
        peak_start_time: null,
        peak_end_time: null,
        updated_by: tambayanOwner,
      };

      const service = existingService
        ? await this.serviceRepository.save({
            ...existingService,
            ...payload,
          })
        : await this.serviceRepository.save(
            this.serviceRepository.create({
              ...payload,
              created_by: tambayanOwner,
            }),
          );

      services.push(service);
    }
    console.log(
      `✅ Tambayan court services ensured (${services.length} courts)`,
    );

    for (const service of services) {
      const existingArea = await this.serviceAreaRepository.findOne({
        where: { seller_id: seller.id, service_id: service.id },
        order: { id: 'ASC' },
      });

      const areaPayload = {
        seller_id: seller.id,
        service_id: service.id,
        city: 'Lapu-Lapu City',
        province: 'Cebu',
        postal_code: '6015',
        barangay: 'Basak',
        center_latitude: 10.3103,
        center_longitude: 123.9494,
        radius_km: 8,
        additional_fee: 0,
        additional_fee_type: AdditionalFeeTypeEnum.FIXED,
        minimum_order_amount: null,
        status: 'Active',
        updated_by: tambayanOwner,
      };

      if (!existingArea) {
        await this.serviceAreaRepository.save(
          this.serviceAreaRepository.create({
            ...areaPayload,
            created_by: tambayanOwner,
          }),
        );
        continue;
      }

      await this.serviceAreaRepository.save({
        ...existingArea,
        ...areaPayload,
      });
    }
    console.log('✅ Tambayan service areas ensured (1 per court)');

    for (const court of TAMBAYAN_COURTS) {
      const service = services.find((item) => item.code === court.code);
      if (!service) {
        continue;
      }

      const existingPrimaryImage = await this.serviceGalleryRepository.findOne({
        where: { service_id: service.id, is_primary: true },
      });

      const galleryPayload = {
        service_id: service.id,
        image_url: `${TAMBAYAN_IMAGE_BASE}/${court.imageFileName}`,
        caption: service.title,
        alt_text: service.short_description || service.title,
        is_primary: true,
        display_order: 0,
        status: 'Active',
        updated_by: tambayanOwner,
      };

      if (!existingPrimaryImage) {
        await this.serviceGalleryRepository.save(
          this.serviceGalleryRepository.create({
            ...galleryPayload,
            created_by: tambayanOwner,
          }),
        );
        continue;
      }

      await this.serviceGalleryRepository.save({
        ...existingPrimaryImage,
        ...galleryPayload,
      });
    }
    console.log('✅ Tambayan service gallery ensured');

    console.log(
      '✅ Tambayan District seed completed successfully (8 pickleball courts)',
    );
  }
}
