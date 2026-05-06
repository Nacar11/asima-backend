import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAddonEntity } from '@/service-addons/persistence/entities/service-addon.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';
import { OptionGroupInputTypeEnum } from '@/service-option-groups/enums/option-group-input-type.enum';
import { OptionGroupStatusEnum } from '@/service-option-groups/enums/option-group-status.enum';
import { OptionValueStatusEnum } from '@/service-option-values/enums/option-value-status.enum';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';

/**
 * Seeds a coffee equipment services company for the Store Owner user (owner@cody.inc)
 * Includes: Seller, Schedules, Service Categories, Services, Addons, Option Groups/Values, Service Areas
 */
@Injectable()
export class CoffeeEquipmentServicesSeedService {
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
    @InjectRepository(ServiceAddonEntity)
    private serviceAddonRepository: Repository<ServiceAddonEntity>,
    @InjectRepository(ServiceOptionGroupEntity)
    private serviceOptionGroupRepository: Repository<ServiceOptionGroupEntity>,
    @InjectRepository(ServiceOptionValueEntity)
    private serviceOptionValueRepository: Repository<ServiceOptionValueEntity>,
    @InjectRepository(ServiceAreaEntity)
    private serviceAreaRepository: Repository<ServiceAreaEntity>,
    @InjectRepository(ServiceMilestoneTemplateEntity)
    private serviceMilestoneTemplateRepository: Repository<ServiceMilestoneTemplateEntity>,
    @InjectRepository(ServiceGalleryEntity)
    private serviceGalleryRepository: Repository<ServiceGalleryEntity>,
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
  ) {}

  async run(): Promise<void> {
    // Find the Store Owner user (owner@cody.inc)
    const storeOwner = await this.userRepository.findOne({
      where: { email: 'owner@cody.inc' },
    });

    if (!storeOwner) {
      console.log(
        '⚠️  Store Owner user (owner@cody.inc) not found. Skipping coffee equipment services seed.',
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
      console.log(
        '⚠️  PHP currency not found. Skipping coffee equipment services seed.',
      );
      return;
    }

    // === 1. Create Seller ===
    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          user_id: storeOwner.id,
          store_name: 'Brew Masters Coffee Equipment',
          slug: 'brew-masters-coffee-equipment',
          store_description:
            'Professional coffee equipment repair, maintenance, and installation services. We service espresso machines, grinders, brewing systems, and commercial coffee equipment for cafes, restaurants, and home baristas.',
          store_logo_url: null,
          store_banner_url: null,
          business_registration_number: 'REG-2024-COFFEE-001',
          business_type: null,
          tax_id: 'TIN-2024-BM-001',
          is_verified: true,
          is_active: true,
          sells_products: false,
          sells_services: true,
          auto_accept_bookings: false,
          bio: 'With over 15 years of experience in coffee equipment, we provide expert repair and maintenance services for all major brands including La Marzocco, Nuova Simonelli, Mazzer, and more.',
          years_of_experience: 15,
          hourly_rate: 500.0,
          max_concurrent_bookings: 2,
          max_daily_bookings: 6,
          service_capacity_hours: 8.0,
          status: StatusEnum.ACTIVE,
          // Location: IT Park, Cebu City
          pickup_address: 'IT Park, Lahug',
          pickup_city: 'Cebu City',
          pickup_province: 'Cebu',
          pickup_postal_code: '6000',
          pickup_latitude: 10.3297,
          pickup_longitude: 123.9056,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      console.log(
        '✅ Coffee equipment seller created: Brew Masters Coffee Equipment',
      );
    } else {
      console.log(
        '⚠️  Seller already exists for Store Owner. Using existing seller.',
      );
    }

    // === 2. Create Seller Schedules (Mon-Sat, 8 AM - 6 PM) ===
    const existingSchedulesCount = await this.sellerScheduleRepository.count({
      where: { seller_id: seller.id },
    });

    if (existingSchedulesCount === 0) {
      const schedules: Array<{
        seller_id: number;
        day_of_week: number;
        status: string;
        start_time: string | null;
        end_time: string | null;
        break_start: string | null;
        break_end: string | null;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];
      // Monday (1) to Saturday (6)
      for (let day = 1; day <= 6; day++) {
        schedules.push({
          seller_id: seller.id,
          day_of_week: day,
          status: 'Active',
          start_time: '08:00:00',
          end_time: '18:00:00',
          break_start: '12:00:00',
          break_end: '13:00:00',
          created_by: storeOwner,
          updated_by: storeOwner,
        });
      }
      // Sunday (0) - Closed
      schedules.push({
        seller_id: seller.id,
        day_of_week: 0,
        status: 'Inactive',
        start_time: null,
        end_time: null,
        break_start: null,
        break_end: null,
        created_by: storeOwner,
        updated_by: storeOwner,
      });

      await this.sellerScheduleRepository.save(
        schedules.map((s) => this.sellerScheduleRepository.create(s)),
      );
      console.log('✅ 7 seller schedules created (Mon-Sat active, Sun closed)');
    } else {
      console.log('⚠️  Seller schedules already exist. Skipping.');
    }

    // === 3. Create Service Category for Coffee Equipment ===
    let coffeeEquipmentCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'coffee-equipment-services' },
    });

    if (!coffeeEquipmentCategory) {
      coffeeEquipmentCategory = await this.serviceCategoryRepository.save(
        this.serviceCategoryRepository.create({
          parent_id: null,
          name: 'Coffee Equipment Services',
          code: 'coffee-equipment-services',
          description:
            'Professional coffee machine repair, maintenance, installation, and calibration services',
          icon_url: '/assets/images/travajo/coffee-maker.png',
          image_url: '/assets/images/travajo/coffee-maker.png',
          level: 0,
          display_order: 20,
          is_active: true,
          is_featured: true,
          status: 'Active',
          default_platform_fee_percent: 10.0,
          meta_title: 'Coffee Equipment Services',
          meta_description:
            'Find professional coffee equipment repair and maintenance services',
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      console.log('✅ Coffee Equipment Services category created');
    }

    // === 4. Create Services ===
    let espressoRepairService: ServiceEntity | null = null;
    let grinderCalibrationService: ServiceEntity | null = null;
    let preventiveMaintenanceService: ServiceEntity | null = null;

    const existingServicesCount = await this.serviceRepository.count({
      where: { seller_id: seller.id },
    });

    if (existingServicesCount > 0) {
      console.log(
        '⚠️  Services already exist for this seller. Fetching existing services.',
      );
      // Fetch existing services by code
      espressoRepairService = await this.serviceRepository.findOne({
        where: { seller_id: seller.id, code: 'espresso-machine-repair' },
      });
      grinderCalibrationService = await this.serviceRepository.findOne({
        where: { seller_id: seller.id, code: 'grinder-calibration' },
      });
      preventiveMaintenanceService = await this.serviceRepository.findOne({
        where: { seller_id: seller.id, code: 'preventive-maintenance' },
      });
    } else {
      // Service 1: Espresso Machine Repair
      espressoRepairService = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: coffeeEquipmentCategory.id,
          currency_id: phpCurrency.id,
          title: 'Espresso Machine Repair & Diagnostics',
          code: 'espresso-machine-repair',
          description:
            'Comprehensive repair service for all types of espresso machines. Our certified technicians diagnose and fix issues including pump failures, heating element problems, group head issues, steam wand repairs, and electronic malfunctions. We service both commercial and home espresso machines from brands like La Marzocco, Nuova Simonelli, Rancilio, Breville, and more.',
          short_description:
            'Professional espresso machine repair for commercial and home units',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1500.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 240,
          service_radius_km: 25,
          is_remote_available: false,
          max_bookings_per_day: 4,
          advance_booking_days: 14,
          minimum_notice_hours: 24,
          status: ServiceStatusEnum.ACTIVE,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      // Service 2: Coffee Grinder Calibration
      grinderCalibrationService = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: coffeeEquipmentCategory.id,
          currency_id: phpCurrency.id,
          title: 'Coffee Grinder Calibration & Maintenance',
          code: 'grinder-calibration',
          description:
            'Professional calibration and maintenance service for coffee grinders. Includes burr inspection, alignment, cleaning, and precision calibration for optimal grind consistency. Perfect for cafes wanting to maintain espresso quality and home enthusiasts seeking the perfect grind.',
          short_description:
            'Expert grinder calibration for consistent, quality grinds',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 800.0,
          hourly_rate: null,
          estimated_duration_minutes: 60,
          minimum_duration_minutes: 45,
          maximum_duration_minutes: 90,
          service_radius_km: 25,
          is_remote_available: false,
          max_bookings_per_day: 6,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      // Service 3: Preventive Maintenance Package
      preventiveMaintenanceService = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: coffeeEquipmentCategory.id,
          currency_id: phpCurrency.id,
          title: 'Preventive Maintenance Package',
          code: 'preventive-maintenance',
          description:
            'Comprehensive preventive maintenance for your coffee equipment. Includes deep cleaning, descaling, gasket replacement, water filter check, pressure calibration, and full system diagnostic. Recommended every 3-6 months for commercial equipment.',
          short_description:
            'Complete preventive care to keep your equipment running perfectly',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2500.0,
          hourly_rate: null,
          estimated_duration_minutes: 180,
          minimum_duration_minutes: 120,
          maximum_duration_minutes: 300,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 3,
          advance_booking_days: 21,
          minimum_notice_hours: 48,
          status: ServiceStatusEnum.ACTIVE,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      console.log('✅ 3 coffee equipment services created');
    }

    // Check if all services were found/created
    if (
      !espressoRepairService ||
      !grinderCalibrationService ||
      !preventiveMaintenanceService
    ) {
      console.log(
        '⚠️  Could not find all required services. Skipping dependent data.',
      );
      return;
    }

    // === 5. Create Service Addons ===
    const existingAddonsCount = await this.serviceAddonRepository.count({
      where: { service_id: espressoRepairService.id },
    });

    if (existingAddonsCount > 0) {
      console.log('⚠️  Service addons already exist. Skipping.');
    } else {
      const addons = [
        // Addons for Espresso Machine Repair
        {
          service_id: espressoRepairService.id,
          name: 'Replacement Parts',
          code: 'replacement-parts',
          description:
            'Common replacement parts (gaskets, seals, o-rings). Major parts quoted separately.',
          short_description: 'Basic replacement parts included',
          unit_type: 'per order',
          price: 500.0,
          compare_at_price: null,
          duration_minutes: 0,
          min_quantity: 0,
          max_quantity: 1,
          display_order: 1,
          is_popular: true,
          is_required: false,
          status: AddonStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: espressoRepairService.id,
          name: 'Express Service',
          code: 'express-service',
          description:
            'Priority scheduling - get your machine serviced within 24 hours',
          short_description: 'Same-day or next-day service',
          unit_type: 'per order',
          price: 750.0,
          compare_at_price: 1000.0,
          duration_minutes: 0,
          min_quantity: 0,
          max_quantity: 1,
          display_order: 2,
          is_popular: true,
          is_required: false,
          status: AddonStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Addons for Grinder Calibration
        {
          service_id: grinderCalibrationService.id,
          name: 'Burr Replacement',
          code: 'burr-replacement',
          description:
            'New burr set installation (price varies by grinder model)',
          short_description: 'Replace worn burrs for optimal grinding',
          unit_type: 'per set',
          price: 1500.0,
          compare_at_price: null,
          duration_minutes: 30,
          min_quantity: 0,
          max_quantity: 1,
          display_order: 1,
          is_popular: false,
          is_required: false,
          status: AddonStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Addons for Preventive Maintenance
        {
          service_id: preventiveMaintenanceService.id,
          name: 'Water Filtration System',
          code: 'water-filtration',
          description:
            'Install or replace water filtration system for better water quality',
          short_description: 'Premium water filtration upgrade',
          unit_type: 'per unit',
          price: 2000.0,
          compare_at_price: 2500.0,
          duration_minutes: 45,
          min_quantity: 0,
          max_quantity: 1,
          display_order: 1,
          is_popular: true,
          is_required: false,
          status: AddonStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: preventiveMaintenanceService.id,
          name: 'Extended Warranty',
          code: 'extended-warranty',
          description:
            '6-month warranty on all maintenance work with priority support',
          short_description: '6-month parts & labor warranty',
          unit_type: 'per order',
          price: 1000.0,
          compare_at_price: null,
          duration_minutes: 0,
          min_quantity: 0,
          max_quantity: 1,
          display_order: 2,
          is_popular: true,
          is_required: false,
          status: AddonStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
      ];

      await this.serviceAddonRepository.save(
        addons.map((a) => this.serviceAddonRepository.create(a)),
      );
      console.log('✅ 5 service addons created');
    }

    // === 6. Create Service Option Groups and Values ===
    const existingOptionGroupsCount =
      await this.serviceOptionGroupRepository.count({
        where: { service_id: espressoRepairService.id },
      });

    if (existingOptionGroupsCount > 0) {
      console.log('⚠️  Service option groups already exist. Skipping.');
    } else {
      // Option Group 1: Machine Type (for Espresso Machine Repair)
      const machineTypeGroup = await this.serviceOptionGroupRepository.save(
        this.serviceOptionGroupRepository.create({
          service_id: espressoRepairService.id,
          name: 'Machine Type',
          code: 'machine-type',
          description: 'Select your espresso machine type for accurate pricing',
          input_type: OptionGroupInputTypeEnum.SELECT,
          min_value: null,
          max_value: null,
          default_value: null,
          display_order: 1,
          is_required: true,
          status: OptionGroupStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      // Option Values for Machine Type
      const machineTypeValues = [
        {
          option_group_id: machineTypeGroup.id,
          label: 'Home/Semi-Automatic',
          value: 'home-semi-auto',
          description: 'Home espresso machines and semi-automatic units',
          price_adjustment: 0,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 0,
          display_order: 1,
          is_default: true,
          status: OptionValueStatusEnum.ACTIVE,
        },
        {
          option_group_id: machineTypeGroup.id,
          label: 'Commercial Single Group',
          value: 'commercial-single',
          description: 'Commercial single group espresso machines',
          price_adjustment: 500,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 30,
          display_order: 2,
          is_default: false,
          status: OptionValueStatusEnum.ACTIVE,
        },
        {
          option_group_id: machineTypeGroup.id,
          label: 'Commercial Multi-Group',
          value: 'commercial-multi',
          description: '2-4 group commercial espresso machines',
          price_adjustment: 1500,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 60,
          display_order: 3,
          is_default: false,
          status: OptionValueStatusEnum.ACTIVE,
        },
      ];

      await this.serviceOptionValueRepository.save(
        machineTypeValues.map((v) =>
          this.serviceOptionValueRepository.create(v),
        ),
      );

      // Option Group 2: Grinder Type (for Grinder Calibration)
      const grinderTypeGroup = await this.serviceOptionGroupRepository.save(
        this.serviceOptionGroupRepository.create({
          service_id: grinderCalibrationService.id,
          name: 'Grinder Type',
          code: 'grinder-type',
          description: 'Select your grinder type',
          input_type: OptionGroupInputTypeEnum.SELECT,
          min_value: null,
          max_value: null,
          default_value: null,
          display_order: 1,
          is_required: true,
          status: OptionGroupStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      // Option Values for Grinder Type
      const grinderTypeValues = [
        {
          option_group_id: grinderTypeGroup.id,
          label: 'Home Grinder',
          value: 'home-grinder',
          description: 'Consumer-grade home grinders',
          price_adjustment: 0,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 0,
          display_order: 1,
          is_default: true,
          status: OptionValueStatusEnum.ACTIVE,
        },
        {
          option_group_id: grinderTypeGroup.id,
          label: 'Commercial Doser',
          value: 'commercial-doser',
          description: 'Commercial grinders with doser',
          price_adjustment: 300,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 15,
          display_order: 2,
          is_default: false,
          status: OptionValueStatusEnum.ACTIVE,
        },
        {
          option_group_id: grinderTypeGroup.id,
          label: 'Commercial On-Demand',
          value: 'commercial-on-demand',
          description: 'Premium commercial on-demand grinders',
          price_adjustment: 500,
          price_multiplier: 1.0,
          duration_adjustment_minutes: 20,
          display_order: 3,
          is_default: false,
          status: OptionValueStatusEnum.ACTIVE,
        },
      ];

      await this.serviceOptionValueRepository.save(
        grinderTypeValues.map((v) =>
          this.serviceOptionValueRepository.create(v),
        ),
      );

      // Option Group 3: Equipment Count (for Preventive Maintenance)
      const equipmentCountGroup = await this.serviceOptionGroupRepository.save(
        this.serviceOptionGroupRepository.create({
          service_id: preventiveMaintenanceService.id,
          name: 'Number of Machines',
          code: 'equipment-count',
          description: 'How many machines need maintenance?',
          input_type: OptionGroupInputTypeEnum.COUNTER,
          min_value: 1,
          max_value: 5,
          default_value: 1,
          display_order: 1,
          is_required: true,
          status: OptionGroupStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );

      // For counter type, we create a single value that represents per-unit pricing
      await this.serviceOptionValueRepository.save(
        this.serviceOptionValueRepository.create({
          option_group_id: equipmentCountGroup.id,
          label: 'Per Machine',
          value: 'per-machine',
          description: 'Price per additional machine',
          price_adjustment: 1500, // Each additional machine adds 1500
          price_multiplier: 1.0,
          duration_adjustment_minutes: 60,
          display_order: 1,
          is_default: true,
          status: OptionValueStatusEnum.ACTIVE,
        }),
      );

      console.log('✅ 3 option groups with 7 option values created');
    }

    // === 7. Create Service Areas (Real Cebu Coordinates) ===
    const existingServiceAreasCount = await this.serviceAreaRepository.count({
      where: { service_id: espressoRepairService.id },
    });

    if (existingServiceAreasCount > 0) {
      console.log('⚠️  Service areas already exist. Skipping.');
    } else {
      const serviceAreas = [
        // Cebu City Areas
        {
          seller_id: seller.id,
          service_id: espressoRepairService.id,
          city: 'Cebu City',
          province: 'Cebu',
          postal_code: '6000',
          barangay: 'Lahug',
          center_latitude: 10.3297,
          center_longitude: 123.9056,
          radius_km: 5,
          additional_fee: 0,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: null,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          seller_id: seller.id,
          service_id: espressoRepairService.id,
          city: 'Cebu City',
          province: 'Cebu',
          postal_code: '6000',
          barangay: 'Banilad',
          center_latitude: 10.3416,
          center_longitude: 123.9115,
          radius_km: 5,
          additional_fee: 0,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: null,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          seller_id: seller.id,
          service_id: espressoRepairService.id,
          city: 'Mandaue City',
          province: 'Cebu',
          postal_code: '6014',
          barangay: 'Centro',
          center_latitude: 10.3236,
          center_longitude: 123.9223,
          radius_km: 8,
          additional_fee: 100,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 1000,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          seller_id: seller.id,
          service_id: espressoRepairService.id,
          city: 'Lapu-Lapu City',
          province: 'Cebu',
          postal_code: '6015',
          barangay: 'Mactan',
          center_latitude: 10.3103,
          center_longitude: 123.9494,
          radius_km: 10,
          additional_fee: 200,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 1500,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Service areas for Grinder Calibration
        {
          seller_id: seller.id,
          service_id: grinderCalibrationService.id,
          city: 'Cebu City',
          province: 'Cebu',
          postal_code: '6000',
          barangay: null,
          center_latitude: 10.3157,
          center_longitude: 123.8854,
          radius_km: 15,
          additional_fee: 0,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: null,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          seller_id: seller.id,
          service_id: grinderCalibrationService.id,
          city: 'Talisay City',
          province: 'Cebu',
          postal_code: '6045',
          barangay: null,
          center_latitude: 10.2447,
          center_longitude: 123.8494,
          radius_km: 10,
          additional_fee: 150,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 800,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Service areas for Preventive Maintenance (wider coverage)
        {
          seller_id: seller.id,
          service_id: preventiveMaintenanceService.id,
          city: 'Cebu City',
          province: 'Cebu',
          postal_code: '6000',
          barangay: null,
          center_latitude: 10.3157,
          center_longitude: 123.8854,
          radius_km: 20,
          additional_fee: 0,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: null,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          seller_id: seller.id,
          service_id: preventiveMaintenanceService.id,
          city: 'Metro Cebu',
          province: 'Cebu',
          postal_code: null,
          barangay: null,
          center_latitude: 10.3157,
          center_longitude: 123.8854,
          radius_km: 30,
          additional_fee: 25,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 2500,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
      ];

      await this.serviceAreaRepository.save(
        serviceAreas.map((a) => this.serviceAreaRepository.create(a)),
      );
      console.log('✅ 8 service areas created with real Cebu coordinates');
    }

    // === 8. Create Service Milestone Templates ===
    const existingMilestonesCount =
      await this.serviceMilestoneTemplateRepository.count({
        where: { service_id: espressoRepairService.id },
      });

    if (existingMilestonesCount > 0) {
      console.log('⚠️  Service milestone templates already exist. Skipping.');
    } else {
      const milestoneTemplates = [
        // Milestones for Espresso Machine Repair & Diagnostics
        {
          service_id: espressoRepairService.id,
          package_id: null,
          name: 'Initial Diagnosis',
          description:
            'Comprehensive inspection and diagnosis of your espresso machine. We identify all issues, test components, and provide a detailed assessment of required repairs.',
          sequence_order: 1,
          estimated_duration_hours: 0.5,
          estimated_duration_days: null,
          payment_percent: 20.0,
          deliverables: [
            {
              name: 'Diagnostic Report',
              description: 'Detailed issue report',
              type: 'document',
            },
            {
              name: 'Before Photos',
              description: 'Photos of current condition',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: espressoRepairService.id,
          package_id: null,
          name: 'Repair Work',
          description:
            'Main repair and replacement of faulty components. Includes disassembly, part replacement, reassembly, and initial testing of repaired systems.',
          sequence_order: 2,
          estimated_duration_hours: 1.5,
          estimated_duration_days: null,
          payment_percent: 60.0,
          deliverables: [
            {
              name: 'Parts Used',
              description: 'List of replaced parts',
              type: 'document',
            },
            {
              name: 'Repair Photos',
              description: 'Photos of repair work',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: espressoRepairService.id,
          package_id: null,
          name: 'Testing & Handover',
          description:
            'Final testing of all machine functions, espresso extraction test, steam wand test, and customer handover with care instructions.',
          sequence_order: 3,
          estimated_duration_hours: 0.5,
          estimated_duration_days: null,
          payment_percent: 20.0,
          deliverables: [
            {
              name: 'Test Results',
              description: 'Final testing documentation',
              type: 'document',
            },
            {
              name: 'After Photos',
              description: 'Photos showing completed work',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },

        // Milestones for Coffee Grinder Calibration & Maintenance
        {
          service_id: grinderCalibrationService.id,
          package_id: null,
          name: 'Inspection & Assessment',
          description:
            'Initial inspection of grinder condition, burr wear assessment, and cleaning needs evaluation.',
          sequence_order: 1,
          estimated_duration_hours: 0.25,
          estimated_duration_days: null,
          payment_percent: 30.0,
          deliverables: [
            {
              name: 'Burr Condition Report',
              description: 'Assessment of burr wear',
              type: 'document',
            },
            {
              name: 'Before Photos',
              description: 'Current grinder condition',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: grinderCalibrationService.id,
          package_id: null,
          name: 'Calibration & Maintenance',
          description:
            'Deep cleaning, burr alignment, and precision calibration for optimal grind consistency at various settings.',
          sequence_order: 2,
          estimated_duration_hours: 0.5,
          estimated_duration_days: null,
          payment_percent: 50.0,
          deliverables: [
            {
              name: 'Calibration Settings',
              description: 'Documented grind settings',
              type: 'document',
            },
            {
              name: 'Cleaning Photos',
              description: 'Before/after cleaning',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: grinderCalibrationService.id,
          package_id: null,
          name: 'Final Testing',
          description:
            'Quality verification with test grinds at multiple settings, particle consistency check, and customer demonstration.',
          sequence_order: 3,
          estimated_duration_hours: 0.25,
          estimated_duration_days: null,
          payment_percent: 20.0,
          deliverables: [
            {
              name: 'Grind Samples',
              description: 'Sample grinds at different settings',
              type: 'photo',
            },
            {
              name: 'Handover Notes',
              description: 'Recommended settings guide',
              type: 'document',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },

        // Milestones for Preventive Maintenance Package
        {
          service_id: preventiveMaintenanceService.id,
          package_id: null,
          name: 'System Inspection',
          description:
            'Comprehensive inspection of all equipment systems including pressure, temperature, electrical, and water flow.',
          sequence_order: 1,
          estimated_duration_hours: 0.5,
          estimated_duration_days: null,
          payment_percent: 20.0,
          deliverables: [
            {
              name: 'Inspection Checklist',
              description: 'Full system inspection report',
              type: 'document',
            },
            {
              name: 'Before Photos',
              description: 'Current equipment state',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: preventiveMaintenanceService.id,
          package_id: null,
          name: 'Cleaning & Descaling',
          description:
            'Deep cleaning of group heads, steam wands, drip trays, and full descaling of water system and boiler.',
          sequence_order: 2,
          estimated_duration_hours: 1.0,
          estimated_duration_days: null,
          payment_percent: 30.0,
          deliverables: [
            {
              name: 'Cleaning Report',
              description: 'Areas cleaned and products used',
              type: 'document',
            },
            {
              name: 'Cleaning Photos',
              description: 'Before/after cleaning comparison',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: preventiveMaintenanceService.id,
          package_id: null,
          name: 'Parts Replacement',
          description:
            'Replacement of gaskets, seals, o-rings, water filter, and any worn components identified during inspection.',
          sequence_order: 3,
          estimated_duration_hours: 1.0,
          estimated_duration_days: null,
          payment_percent: 30.0,
          deliverables: [
            {
              name: 'Parts List',
              description: 'All replaced parts with specs',
              type: 'document',
            },
            {
              name: 'Replacement Photos',
              description: 'Old vs new parts',
              type: 'photo',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        {
          service_id: preventiveMaintenanceService.id,
          package_id: null,
          name: 'Calibration & Final Testing',
          description:
            'Pressure and temperature calibration, extraction timing tests, and full system verification with customer handover.',
          sequence_order: 4,
          estimated_duration_hours: 0.5,
          estimated_duration_days: null,
          payment_percent: 20.0,
          deliverables: [
            {
              name: 'Calibration Report',
              description: 'Final pressure and temp readings',
              type: 'document',
            },
            {
              name: 'After Photos',
              description: 'Completed maintenance photos',
              type: 'photo',
            },
            {
              name: 'Maintenance Log',
              description: 'Full service record for equipment',
              type: 'document',
            },
          ],
          requires_customer_approval: true,
          auto_approve_after_hours: 24,
          status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          created_by: storeOwner,
          updated_by: storeOwner,
        },
      ];

      await this.serviceMilestoneTemplateRepository.save(
        milestoneTemplates.map((m) =>
          this.serviceMilestoneTemplateRepository.create(m),
        ),
      );
      console.log(
        '✅ 10 service milestone templates created (3+3+4 per service)',
      );
    }

    // === 9. Create Service Gallery Images ===
    const existingGalleryCount = await this.serviceGalleryRepository.count({
      where: { service_id: espressoRepairService.id },
    });

    if (existingGalleryCount > 0) {
      console.log('⚠️  Service gallery already exists. Skipping.');
    } else {
      const galleryItems = [
        // Gallery for Espresso Machine Repair
        {
          service_id: espressoRepairService.id,
          image_url: '/assets/images/travajo/coffee-maker.png',
          caption: 'Espresso Machine Repair & Diagnostics',
          alt_text: 'Professional espresso machine repair service',
          is_primary: true,
          display_order: 0,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Gallery for Grinder Calibration
        {
          service_id: grinderCalibrationService.id,
          image_url: '/assets/images/travajo/coffee-seed.png',
          caption: 'Coffee Grinder Calibration & Maintenance',
          alt_text: 'Professional coffee grinder calibration service',
          is_primary: true,
          display_order: 0,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
        // Gallery for Preventive Maintenance
        {
          service_id: preventiveMaintenanceService.id,
          image_url: '/assets/images/travajo/travajoe_menu.png',
          caption: 'Preventive Maintenance Package',
          alt_text: 'Comprehensive preventive maintenance for coffee equipment',
          is_primary: true,
          display_order: 0,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        },
      ];

      await this.serviceGalleryRepository.save(
        galleryItems.map((g) => this.serviceGalleryRepository.create(g)),
      );
      console.log('✅ 3 service gallery images created');
    }

    console.log('✅ Coffee equipment services seed completed successfully');
  }
}
