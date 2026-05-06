import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { ISeedService } from '../seed.interface';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { StorageService } from '@/storage/storage.service';
import * as fs from 'fs/promises';
import { join } from 'path';

type LocationKey = 'anjo' | 'tambayan';

type TambayanCourtServiceCode =
  | 'tambayan-pickleball-court-1'
  | 'tambayan-pickleball-court-2'
  | 'tambayan-pickleball-court-3'
  | 'tambayan-pickleball-court-4'
  | 'tambayan-pickleball-court-5'
  | 'tambayan-pickleball-court-6'
  | 'tambayan-pickleball-court-7'
  | 'tambayan-pickleball-court-8';

type MerchantCode =
  | 'zooooom-carwash-anjo'
  | 'zooooom-carwash-tambayan'
  | 'tambayan-massage'
  | 'tambayan-nailspa'
  | 'everyday-coffee-anjo'
  | 'everyday-coffee-tambayan'
  | 'tambayan-barbershop'
  | 'ulrak-tambayan';

type AdditionalGeneralServiceCode =
  | 'zooooom-carwash-anjo-premium-carwash'
  | 'zooooom-carwash-tambayan-premium-carwash'
  | 'tambayan-massage-90-min'
  | 'tambayan-nailspa-gel-manicure'
  | 'everyday-coffee-anjo-signature-latte'
  | 'everyday-coffee-tambayan-signature-latte'
  | 'tambayan-barbershop-haircut-beard-trim'
  | 'ulrak-tambayan-intro-clinic'
  | 'ulrak-tambayan-paddle-rental';

type LocationConfig = {
  readonly label: string;
  readonly address_line1: string;
  readonly address_line2: string | null;
  readonly city: string;
  readonly state_province: string;
  readonly postal_code: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
};

type ServiceCode =
  | MerchantCode
  | AdditionalGeneralServiceCode
  | TambayanCourtServiceCode;

type ServiceSeedDefinition = {
  readonly title: string;
  readonly code: ServiceCode;
  readonly merchantCode?: MerchantCode;
  readonly merchantName?: string;
  readonly location: LocationKey;
  readonly categoryCode?: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly pricingType: PricingTypeEnum;
  readonly serviceType: ServiceTypeEnum;
  readonly basePrice: number;
  readonly hourlyRate: number | null;
  readonly estimatedDurationMinutes: number;
  readonly minimumDurationMinutes: number;
  readonly maximumDurationMinutes: number;
  readonly venueCapacity?: number | null;
  readonly slotDurationMinutes?: number | null;
  readonly advanceBookingDays?: number;
  readonly minimumNoticeHours?: number;
  readonly isFeatured?: boolean;
};

const LOCATION_CONFIG: Record<LocationKey, LocationConfig> = {
  anjo: {
    label: 'Walk-in location (Anjo)',
    address_line1: 'Anjo World',
    address_line2: 'Upper Belmont One, South Road, Calajo-an',
    city: 'Minglanilla',
    state_province: 'Cebu',
    postal_code: '6046',
    country: 'Philippines',
    latitude: 10.2356,
    longitude: 123.7994,
  },
  tambayan: {
    label: 'Walk-in location (Tambayan)',
    address_line1: 'Tambayan District, Basak',
    address_line2: null,
    city: 'Lapu-Lapu City',
    state_province: 'Cebu',
    postal_code: '6015',
    country: 'Philippines',
    latitude: 10.3103,
    longitude: 123.9494,
  },
};

const SERVICE_IMAGE_FILES: Record<
  ServiceCode,
  { fileName: string; contentType: 'image/png' | 'image/jpeg' }
> = {
  'zooooom-carwash-anjo': {
    fileName: 'zooomcarwash_anjo_logo.png',
    contentType: 'image/png',
  },
  'zooooom-carwash-anjo-premium-carwash': {
    fileName: 'zooomcarwash_anjo_logo.png',
    contentType: 'image/png',
  },
  'zooooom-carwash-tambayan': {
    fileName: 'zoomcarwash_tambayan_logo.png',
    contentType: 'image/png',
  },
  'zooooom-carwash-tambayan-premium-carwash': {
    fileName: 'zoomcarwash_tambayan_logo.png',
    contentType: 'image/png',
  },
  'tambayan-massage': {
    fileName: 'tambayan_massage_logo.jpg',
    contentType: 'image/jpeg',
  },
  'tambayan-massage-90-min': {
    fileName: 'tambayan_massage_logo.jpg',
    contentType: 'image/jpeg',
  },
  'tambayan-nailspa': {
    fileName: 'nailspa_tambayan_logo.png',
    contentType: 'image/png',
  },
  'tambayan-nailspa-gel-manicure': {
    fileName: 'nailspa_tambayan_logo.png',
    contentType: 'image/png',
  },
  'everyday-coffee-anjo': {
    fileName: 'everyday_coffee_anjo_logo.jpg',
    contentType: 'image/jpeg',
  },
  'everyday-coffee-anjo-signature-latte': {
    fileName: 'everyday_coffee_anjo_logo.jpg',
    contentType: 'image/jpeg',
  },
  'everyday-coffee-tambayan': {
    fileName: 'everyday_coffee_tambayan_logo.jpg',
    contentType: 'image/jpeg',
  },
  'everyday-coffee-tambayan-signature-latte': {
    fileName: 'everyday_coffee_tambayan_logo.jpg',
    contentType: 'image/jpeg',
  },
  'tambayan-barbershop': {
    fileName: 'tambayan_barbershop_logo.jpg',
    contentType: 'image/jpeg',
  },
  'tambayan-barbershop-haircut-beard-trim': {
    fileName: 'tambayan_barbershop_logo.jpg',
    contentType: 'image/jpeg',
  },
  'ulrak-tambayan': {
    fileName: 'ulrak_tambayan_logo.jpg',
    contentType: 'image/jpeg',
  },
  'ulrak-tambayan-intro-clinic': {
    fileName: 'ulrak_tambayan_logo.jpg',
    contentType: 'image/jpeg',
  },
  'ulrak-tambayan-paddle-rental': {
    fileName: 'ulrak_tambayan_logo.jpg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-1': {
    fileName: 'standard.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-2': {
    fileName: 'premium.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-3': {
    fileName: 'standard.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-4': {
    fileName: 'premium.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-5': {
    fileName: 'standard.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-6': {
    fileName: 'premium.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-7': {
    fileName: 'standard.jpeg',
    contentType: 'image/jpeg',
  },
  'tambayan-pickleball-court-8': {
    fileName: 'premium.jpeg',
    contentType: 'image/jpeg',
  },
};
const MERCHANT_USER_IDS: Record<MerchantCode, string> = {
  'zooooom-carwash-anjo': '1000201',
  'zooooom-carwash-tambayan': '1000202',
  'tambayan-massage': '1000203',
  'tambayan-nailspa': '1000204',
  'everyday-coffee-anjo': '1000205',
  'everyday-coffee-tambayan': '1000206',
  'tambayan-barbershop': '1000207',
  'ulrak-tambayan': '1000208',
};

const TAMBAYAN_ULRAK_COURT_SERVICES: ReadonlyArray<ServiceSeedDefinition> =
  Array.from({ length: 8 }, (_, index) => {
    const courtNumber = index + 1;
    const code =
      `tambayan-pickleball-court-${courtNumber}` as TambayanCourtServiceCode;
    return {
      title: `Pickleball Court ${courtNumber}`,
      code,
      merchantCode: 'ulrak-tambayan',
      merchantName: 'Ulrak Tambayan',
      location: 'tambayan',
      categoryCode: 'racket-sports',
      description: `Book Pickleball Court ${courtNumber} at Tambayan District in Basak, Lapu-Lapu City. Full-size regulation court with hourly booking, court lighting, and venue staff on site.`,
      shortDescription: `Pickleball Court ${courtNumber} — hourly rental`,
      pricingType: PricingTypeEnum.HOURLY,
      serviceType: ServiceTypeEnum.VENUE,
      basePrice: 500,
      hourlyRate: 500,
      estimatedDurationMinutes: 60,
      minimumDurationMinutes: 60,
      maximumDurationMinutes: 240,
      venueCapacity: 1,
      slotDurationMinutes: 60,
      advanceBookingDays: 14,
      minimumNoticeHours: 2,
      isFeatured: courtNumber <= 4,
    };
  });

const SEEDED_SERVICES: ReadonlyArray<ServiceSeedDefinition> = [
  {
    title: 'Standard Carwash',
    code: 'zooooom-carwash-anjo',
    merchantName: 'Zooooom Carwash Anjo',
    location: 'anjo',
    categoryCode: 'car-wash-detailing',
    description:
      'Standard exterior and interior carwash package at the Anjo location.',
    shortDescription: 'Standard Carwash',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 250,
    hourlyRate: null,
    estimatedDurationMinutes: 45,
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 90,
  },
  {
    title: 'Premium Carwash',
    code: 'zooooom-carwash-anjo-premium-carwash',
    merchantCode: 'zooooom-carwash-anjo',
    merchantName: 'Zooooom Carwash Anjo',
    location: 'anjo',
    categoryCode: 'car-wash-detailing',
    description:
      'Premium wash with interior detailing and tire shine at the Anjo location.',
    shortDescription: 'Premium Carwash',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 380,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 45,
    maximumDurationMinutes: 120,
  },
  {
    title: 'Standard Carwash',
    code: 'zooooom-carwash-tambayan',
    merchantName: 'Zooooom Carwash Tambayan',
    location: 'tambayan',
    categoryCode: 'car-wash-detailing',
    description:
      'Standard exterior and interior carwash package at the Tambayan location.',
    shortDescription: 'Standard Carwash',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 250,
    hourlyRate: null,
    estimatedDurationMinutes: 45,
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 90,
  },
  {
    title: 'Premium Carwash',
    code: 'zooooom-carwash-tambayan-premium-carwash',
    merchantCode: 'zooooom-carwash-tambayan',
    merchantName: 'Zooooom Carwash Tambayan',
    location: 'tambayan',
    categoryCode: 'car-wash-detailing',
    description:
      'Premium wash with interior detailing and tire shine at the Tambayan location.',
    shortDescription: 'Premium Carwash',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 380,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 45,
    maximumDurationMinutes: 120,
  },
  {
    title: '60-min Massage',
    code: 'tambayan-massage',
    merchantName: 'Tambayan Massage',
    location: 'tambayan',
    categoryCode: 'massage-spa',
    description:
      'Relaxing 60-minute full-body massage session at the Tambayan wellness area.',
    shortDescription: '60-min Massage',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 600,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 60,
    maximumDurationMinutes: 90,
  },
  {
    title: '90-min Massage',
    code: 'tambayan-massage-90-min',
    merchantCode: 'tambayan-massage',
    merchantName: 'Tambayan Massage',
    location: 'tambayan',
    categoryCode: 'massage-spa',
    description:
      'Extended 90-minute full-body massage session for deeper relaxation at Tambayan.',
    shortDescription: '90-min Massage',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 850,
    hourlyRate: null,
    estimatedDurationMinutes: 90,
    minimumDurationMinutes: 90,
    maximumDurationMinutes: 120,
  },
  {
    title: 'Mani-Pedi Service',
    code: 'tambayan-nailspa',
    merchantName: 'Tambayan Nailspa',
    location: 'tambayan',
    categoryCode: 'nail-salon',
    description:
      'Classic manicure and pedicure session at the Tambayan beauty area.',
    shortDescription: 'Mani-Pedi Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 450,
    hourlyRate: null,
    estimatedDurationMinutes: 75,
    minimumDurationMinutes: 60,
    maximumDurationMinutes: 120,
  },
  {
    title: 'Gel Manicure Service',
    code: 'tambayan-nailspa-gel-manicure',
    merchantCode: 'tambayan-nailspa',
    merchantName: 'Tambayan Nailspa',
    location: 'tambayan',
    categoryCode: 'nail-salon',
    description:
      'Gel manicure and polish care service at the Tambayan beauty area.',
    shortDescription: 'Gel Manicure Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 550,
    hourlyRate: null,
    estimatedDurationMinutes: 90,
    minimumDurationMinutes: 60,
    maximumDurationMinutes: 120,
  },
  {
    title: 'Coffee Service',
    code: 'everyday-coffee-anjo',
    merchantName: 'Everyday Coffee Anjo',
    location: 'anjo',
    description:
      'Coffee tasting and cafe-style beverage service at the Anjo location.',
    shortDescription: 'Coffee Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 150,
    hourlyRate: null,
    estimatedDurationMinutes: 30,
    minimumDurationMinutes: 15,
    maximumDurationMinutes: 45,
  },
  {
    title: 'Signature Latte Service',
    code: 'everyday-coffee-anjo-signature-latte',
    merchantCode: 'everyday-coffee-anjo',
    merchantName: 'Everyday Coffee Anjo',
    location: 'anjo',
    description:
      'Specialty latte preparation and guided tasting at the Anjo cafe location.',
    shortDescription: 'Signature Latte Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 180,
    hourlyRate: null,
    estimatedDurationMinutes: 30,
    minimumDurationMinutes: 15,
    maximumDurationMinutes: 45,
  },
  {
    title: 'Coffee Service',
    code: 'everyday-coffee-tambayan',
    merchantName: 'Everyday Coffee Tambayan',
    location: 'tambayan',
    description:
      'Coffee tasting and cafe-style beverage service at the Tambayan location.',
    shortDescription: 'Coffee Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 150,
    hourlyRate: null,
    estimatedDurationMinutes: 30,
    minimumDurationMinutes: 15,
    maximumDurationMinutes: 45,
  },
  {
    title: 'Signature Latte Service',
    code: 'everyday-coffee-tambayan-signature-latte',
    merchantCode: 'everyday-coffee-tambayan',
    merchantName: 'Everyday Coffee Tambayan',
    location: 'tambayan',
    description:
      'Specialty latte preparation and guided tasting at the Tambayan cafe location.',
    shortDescription: 'Signature Latte Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 180,
    hourlyRate: null,
    estimatedDurationMinutes: 30,
    minimumDurationMinutes: 15,
    maximumDurationMinutes: 45,
  },
  {
    title: 'Barber Service',
    code: 'tambayan-barbershop',
    merchantName: 'Tambayan Barbershop',
    location: 'tambayan',
    categoryCode: 'barbershop',
    description:
      'Classic haircut and grooming session at the Tambayan barbershop.',
    shortDescription: 'Barber Service',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 250,
    hourlyRate: null,
    estimatedDurationMinutes: 45,
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 60,
  },
  {
    title: 'Haircut + Beard Trim',
    code: 'tambayan-barbershop-haircut-beard-trim',
    merchantCode: 'tambayan-barbershop',
    merchantName: 'Tambayan Barbershop',
    location: 'tambayan',
    categoryCode: 'barbershop',
    description:
      'Full haircut plus beard trim and basic styling at the Tambayan barbershop.',
    shortDescription: 'Haircut + Beard Trim',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 350,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 45,
    maximumDurationMinutes: 75,
  },
  {
    title: 'Pickleball Intro Clinic',
    code: 'ulrak-tambayan-intro-clinic',
    merchantCode: 'ulrak-tambayan',
    merchantName: 'Ulrak Tambayan',
    location: 'tambayan',
    categoryCode: 'racket-sports',
    description:
      'Beginner-friendly pickleball intro clinic with coach guidance at Ulrak Tambayan.',
    shortDescription: 'Pickleball Intro Clinic',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 400,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 60,
    maximumDurationMinutes: 120,
  },
  {
    title: 'Pickleball Paddle Rental',
    code: 'ulrak-tambayan-paddle-rental',
    merchantCode: 'ulrak-tambayan',
    merchantName: 'Ulrak Tambayan',
    location: 'tambayan',
    categoryCode: 'racket-sports',
    description:
      'Hourly paddle and ball rental service for players at Ulrak Tambayan.',
    shortDescription: 'Pickleball Paddle Rental',
    pricingType: PricingTypeEnum.FIXED,
    serviceType: ServiceTypeEnum.GENERAL,
    basePrice: 150,
    hourlyRate: null,
    estimatedDurationMinutes: 60,
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 180,
  },
  ...TAMBAYAN_ULRAK_COURT_SERVICES,
];

@Injectable()
export class ServiceLocationBrandsSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserAddressEntity)
    private userAddressRepository: Repository<UserAddressEntity>,
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
    @InjectRepository(UserGroupEntity)
    private userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private userAssignmentRepository: Repository<UserAssignmentEntity>,
    private storageService: StorageService,
  ) {}

  private slugifyStoreName(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private buildServiceImageKey(def: ServiceSeedDefinition): string {
    const image = SERVICE_IMAGE_FILES[def.code];
    const serviceSlug = this.slugifyStoreName(def.code);
    return `media/sellers/${serviceSlug}/images/originals/${image.fileName}`;
  }

  private resolveMerchantCode(def: ServiceSeedDefinition): MerchantCode {
    return def.merchantCode ?? (def.code as MerchantCode);
  }

  private resolveMerchantName(def: ServiceSeedDefinition): string {
    return def.merchantName ?? def.title;
  }

  private buildMerchantImageKey(
    merchantCode: MerchantCode,
    merchantName: string,
  ): string {
    const image = SERVICE_IMAGE_FILES[merchantCode];
    const sellerSlug = this.slugifyStoreName(merchantName);
    return `media/sellers/${sellerSlug}/images/originals/${image.fileName}`;
  }

  private async uploadSeedImages(): Promise<void> {
    const assets = SEEDED_SERVICES.map((def) => {
      const image = SERVICE_IMAGE_FILES[def.code];
      return {
        fileName: image.fileName,
        objectKey: this.buildServiceImageKey(def),
        contentType: image.contentType,
      };
    });

    for (const asset of assets) {
      const sourcePath = join(
        process.cwd(),
        'public',
        'images',
        asset.fileName,
      );
      try {
        const buffer = await fs.readFile(sourcePath);
        await this.storageService.putBuffer(
          buffer,
          asset.objectKey,
          asset.contentType,
        );
        console.log(
          `✅ Uploaded service-location seed image: ${asset.objectKey}`,
        );
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.warn(
            `⚠️  Missing service-location seed image file: ${sourcePath}`,
          );
          continue;
        }
        console.warn(
          `⚠️  Failed to upload seed image (${asset.objectKey}): ${err.message}`,
        );
      }
    }
  }

  async run(): Promise<void> {
    const owner = await this.userRepository.findOne({
      where: { email: 'owner@cody.inc' },
    });

    if (!owner) {
      console.log(
        '⚠️  owner@cody.inc not found. Skipping service-location brands seed.',
      );
      return;
    }

    const phpCurrency = await this.currencyRepository.findOne({
      where: { code: 'PHP' },
    });

    if (!phpCurrency) {
      console.log(
        '⚠️  PHP currency not found. Skipping service-location brands seed.',
      );
      return;
    }

    await this.uploadSeedImages();

    const sellersByServiceCode = new Map<ServiceCode, SellerEntity>();
    const sellersByMerchantCode = new Map<MerchantCode, SellerEntity>();
    for (const def of SEEDED_SERVICES) {
      const merchantCode = this.resolveMerchantCode(def);
      let seller = sellersByMerchantCode.get(merchantCode);

      if (!seller) {
        seller = await this.ensureSellerForService(owner, def);
        if (seller) {
          sellersByMerchantCode.set(merchantCode, seller);
        }
      }

      if (!seller) {
        console.log(
          `⚠️  Could not prepare seller for ${def.title}. This service will be skipped.`,
        );
        continue;
      }
      sellersByServiceCode.set(def.code, seller);
    }

    const categoryCodes = [
      ...new Set(
        SEEDED_SERVICES.map((service) => service.categoryCode).filter(
          (code): code is string => Boolean(code),
        ),
      ),
    ];
    const categories = await this.serviceCategoryRepository.find({
      where: { code: In(categoryCodes) },
    });
    const categoriesByCode = new Map(
      categories.map((category) => [category.code, category]),
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const def of SEEDED_SERVICES) {
      const seller = sellersByServiceCode.get(def.code);
      if (!seller) {
        console.log(`⚠️  Skipping ${def.title}. Seller is unavailable.`);
        continue;
      }

      const categoryId = def.categoryCode
        ? (categoriesByCode.get(def.categoryCode)?.id ?? null)
        : null;
      if (def.categoryCode && !categoryId) {
        console.log(
          `⚠️  Missing category "${def.categoryCode}" for ${def.title}. Skipping.`,
        );
        continue;
      }

      const payload: Partial<ServiceEntity> = {
        seller_id: seller.id,
        category_id: categoryId,
        currency_id: phpCurrency.id,
        title: def.title,
        code: def.code,
        description: def.description,
        short_description: def.shortDescription,
        pricing_type: def.pricingType,
        service_type: def.serviceType,
        base_price: def.basePrice,
        hourly_rate: def.hourlyRate,
        estimated_duration_minutes: def.estimatedDurationMinutes,
        minimum_duration_minutes: def.minimumDurationMinutes,
        maximum_duration_minutes: def.maximumDurationMinutes,
        service_radius_km: null,
        is_remote_available: false,
        service_location_type: ServiceLocationTypeEnum.WALK_IN,
        venue_capacity:
          def.serviceType === ServiceTypeEnum.VENUE
            ? (def.venueCapacity ?? 1)
            : null,
        slot_duration_minutes:
          def.serviceType === ServiceTypeEnum.VENUE
            ? (def.slotDurationMinutes ?? 60)
            : null,
        peak_price_multiplier: null,
        peak_days: null,
        peak_start_time: null,
        peak_end_time: null,
        max_bookings_per_day: null,
        advance_booking_days: def.advanceBookingDays ?? 30,
        minimum_notice_hours: def.minimumNoticeHours ?? 1,
        status: ServiceStatusEnum.ACTIVE,
        is_featured: def.isFeatured ?? true,
        requires_quote: false,
        instant_booking: true,
        updated_by: owner,
      };

      const existingService = await this.serviceRepository.findOne({
        where: { code: def.code },
      });

      let savedService: ServiceEntity;
      if (!existingService) {
        savedService = await this.serviceRepository.save(
          this.serviceRepository.create({
            ...payload,
            created_by: owner,
          }),
        );
        createdCount++;
      } else {
        savedService = await this.serviceRepository.save({
          ...existingService,
          ...payload,
        });
        updatedCount++;
      }

      await this.upsertServiceArea(
        savedService,
        seller.id,
        def.location,
        owner,
      );
      await this.upsertPrimaryGallery(
        savedService,
        this.buildServiceImageKey(def),
        owner,
      );
    }

    console.log(
      `✅ Service-location brands seed completed (created: ${createdCount}, updated: ${updatedCount})`,
    );
  }

  async down(): Promise<void> {
    const serviceCodes = SEEDED_SERVICES.map((service) => service.code);
    const services = await this.serviceRepository.find({
      where: { code: In(serviceCodes) },
      select: ['id'],
    });

    if (services.length === 0) {
      console.log('ℹ️  No service-location brand services to rollback.');
      return;
    }

    const serviceIds = services.map((service) => service.id);

    await this.serviceGalleryRepository
      .createQueryBuilder()
      .delete()
      .from(ServiceGalleryEntity)
      .where('service_id IN (:...serviceIds)', { serviceIds })
      .execute();

    await this.serviceAreaRepository
      .createQueryBuilder()
      .delete()
      .from(ServiceAreaEntity)
      .where('service_id IN (:...serviceIds)', { serviceIds })
      .execute();

    await this.serviceRepository
      .createQueryBuilder()
      .delete()
      .from(ServiceEntity)
      .where('id IN (:...serviceIds)', { serviceIds })
      .execute();

    console.log(
      `✅ Service-location brands rollback completed (${serviceIds.length} services removed)`,
    );
  }

  private async ensureSellerForService(
    owner: UserEntity,
    def: ServiceSeedDefinition,
  ): Promise<SellerEntity> {
    const location = LOCATION_CONFIG[def.location];
    const merchantCode = this.resolveMerchantCode(def);
    const merchantName = this.resolveMerchantName(def);
    const merchantEmail = `${merchantCode}@cody.inc`;
    const sellerImageKey = this.buildMerchantImageKey(
      merchantCode,
      merchantName,
    );

    let user = await this.userRepository.findOne({
      where: { email: merchantEmail },
    });

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('password', salt);
    const merchantUserPayload = {
      user_id: MERCHANT_USER_IDS[merchantCode],
      first_name: merchantName,
      last_name: 'Merchant',
      email: merchantEmail,
      password,
      salt,
      system_admin: false,
      updated_by: owner,
    } as const;

    if (!user) {
      user = await this.userRepository.save(
        this.userRepository.create({
          ...merchantUserPayload,
          created_by: owner,
        }),
      );
      console.log(`✅ Service-brand merchant user created (${merchantEmail})`);
    } else {
      user = await this.userRepository.save({
        ...user,
        ...merchantUserPayload,
      });
      console.log(
        `✅ Service-brand merchant user updated as store owner (${merchantEmail})`,
      );
    }

    await this.ensureStoreOwnerAssignment(user, owner);

    const walkInAddress = await this.ensureWalkInAddress(
      user,
      owner,
      def.location,
    );

    let seller = await this.sellerRepository.findOne({
      where: [{ slug: merchantCode }, { user_id: user.id }],
    });

    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          user_id: user.id,
          store_name: merchantName,
          slug: merchantCode,
          store_description: def.description,
          store_logo_url: sellerImageKey,
          email: merchantEmail,
          is_verified: true,
          is_active: true,
          sells_products: false,
          sells_services: true,
          status: StatusEnum.ACTIVE,
          auto_accept_bookings: false,
          pickup_address: location.address_line1,
          pickup_city: location.city,
          pickup_province: location.state_province,
          pickup_postal_code: location.postal_code,
          pickup_latitude: location.latitude,
          pickup_longitude: location.longitude,
          service_location_address_id: walkInAddress?.id ?? null,
          created_by: owner,
          updated_by: owner,
        }),
      );
      console.log(
        `✅ Service-brand seller created (${merchantName}) id=${seller.id}`,
      );
    } else {
      seller = await this.sellerRepository.save({
        ...seller,
        user_id: user.id,
        store_name: merchantName,
        slug: merchantCode,
        store_description: def.description,
        store_logo_url: sellerImageKey,
        email: merchantEmail,
        is_verified: true,
        is_active: true,
        sells_products: false,
        sells_services: true,
        status: StatusEnum.ACTIVE,
        auto_accept_bookings: false,
        pickup_address: location.address_line1,
        pickup_city: location.city,
        pickup_province: location.state_province,
        pickup_postal_code: location.postal_code,
        pickup_latitude: location.latitude,
        pickup_longitude: location.longitude,
        service_location_address_id: walkInAddress?.id ?? null,
        updated_by: owner,
      });
    }

    await this.ensureSellerSchedules(seller.id, owner);
    return seller;
  }

  private async ensureWalkInAddress(
    user: UserEntity,
    owner: UserEntity,
    location: LocationKey,
  ): Promise<UserAddressEntity | null> {
    const config = LOCATION_CONFIG[location];
    const existing = await this.userAddressRepository.findOne({
      where: {
        user_id: user.id,
        label: config.label,
      },
    });
    if (existing) {
      return existing;
    }

    return this.userAddressRepository.save(
      this.userAddressRepository.create({
        user_id: user.id,
        label: config.label,
        recipient_name: `${user.first_name} ${user.last_name}`,
        phone: null,
        address_line1: config.address_line1,
        address_line2: config.address_line2,
        city: config.city,
        state_province: config.state_province,
        postal_code: config.postal_code,
        country: config.country,
        is_default: false,
        latitude: config.latitude,
        longitude: config.longitude,
        created_by: owner,
        updated_by: owner,
      }),
    );
  }

  private async ensureStoreOwnerAssignment(
    user: UserEntity,
    owner: UserEntity,
  ): Promise<void> {
    const storeOwnerGroup = await this.userGroupRepository.findOne({
      where: {
        group_name: 'Store Owner',
        seller_id: IsNull(),
      },
    });

    if (!storeOwnerGroup) {
      console.warn(
        `⚠️ Store Owner group not found. Skipping assignment for ${user.email}.`,
      );
      return;
    }

    const existingAssignment = await this.userAssignmentRepository.findOne({
      where: {
        user: { id: user.id },
        group: { id: storeOwnerGroup.id },
      },
      withDeleted: true,
    });

    if (existingAssignment) {
      const shouldRestore =
        existingAssignment.deleted_at !== null ||
        existingAssignment.status !== UserAssignmentStatusEnum.ACTIVE;

      if (!shouldRestore) {
        return;
      }

      await this.userAssignmentRepository.save({
        ...existingAssignment,
        status: UserAssignmentStatusEnum.ACTIVE,
        deleted_at: null,
        deleted_by: null,
        updated_by: owner,
      });

      return;
    }

    await this.userAssignmentRepository.save(
      this.userAssignmentRepository.create({
        user,
        group: storeOwnerGroup,
        status: UserAssignmentStatusEnum.ACTIVE,
        created_by: owner,
        updated_by: owner,
      }),
    );
  }

  private async ensureSellerSchedules(
    sellerId: number,
    owner: UserEntity,
  ): Promise<void> {
    const existingCount = await this.sellerScheduleRepository.count({
      where: { seller_id: sellerId },
    });

    if (existingCount > 0) {
      return;
    }

    const schedules: Array<Partial<SellerScheduleEntity>> = [];
    for (let day = 0; day <= 6; day++) {
      schedules.push({
        seller_id: sellerId,
        day_of_week: day,
        status: 'Active',
        start_time: '08:00:00',
        end_time: '22:00:00',
        break_start: null,
        break_end: null,
        created_by: owner,
        updated_by: owner,
      });
    }

    await this.sellerScheduleRepository.save(
      schedules.map((schedule) =>
        this.sellerScheduleRepository.create(schedule),
      ),
    );
  }

  private async upsertServiceArea(
    service: ServiceEntity,
    sellerId: number,
    location: LocationKey,
    owner: UserEntity,
  ): Promise<void> {
    const config = LOCATION_CONFIG[location];
    const existing = await this.serviceAreaRepository.findOne({
      where: {
        service_id: service.id,
        city: config.city,
        province: config.state_province,
      },
    });

    const payload: Partial<ServiceAreaEntity> = {
      seller_id: sellerId,
      service_id: service.id,
      city: config.city,
      province: config.state_province,
      postal_code: config.postal_code,
      barangay: null,
      center_latitude: config.latitude,
      center_longitude: config.longitude,
      radius_km: 12,
      additional_fee: 0,
      additional_fee_type: AdditionalFeeTypeEnum.FIXED,
      minimum_order_amount: null,
      status: 'Active',
      updated_by: owner,
    };

    if (!existing) {
      await this.serviceAreaRepository.save(
        this.serviceAreaRepository.create({
          ...payload,
          created_by: owner,
        }),
      );
      return;
    }

    await this.serviceAreaRepository.save({
      ...existing,
      ...payload,
    });
  }

  private async upsertPrimaryGallery(
    service: ServiceEntity,
    imageUrl: string,
    owner: UserEntity,
  ): Promise<void> {
    const existing = await this.serviceGalleryRepository.findOne({
      where: {
        service_id: service.id,
        is_primary: true,
      },
    });

    const payload: Partial<ServiceGalleryEntity> = {
      service_id: service.id,
      image_url: imageUrl,
      caption: service.title,
      alt_text: service.short_description || service.title,
      is_primary: true,
      display_order: 0,
      status: 'Active',
      updated_by: owner,
    };

    if (!existing) {
      await this.serviceGalleryRepository.save(
        this.serviceGalleryRepository.create({
          ...payload,
          created_by: owner,
        }),
      );
      return;
    }

    await this.serviceGalleryRepository.save({
      ...existing,
      ...payload,
    });
  }
}
