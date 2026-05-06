import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FormTemplateEntity } from '@/form-templates/persistence/entities/form-template.entity';
import { FormTemplateOptionEntity } from '@/form-templates/persistence/entities/form-template-option.entity';
import { FormTemplateValidationRuleEntity } from '@/form-templates/persistence/entities/form-template-validation-rule.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from '@/booking-milestones/enums/checklist-response-type.enum';
import { FormFieldTypeEnum } from '@/form-templates/enums/form-field-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';

/**
 * Seeds MEPF (Mechanical, Electrical, Plumbing, Fire Protection) services
 * for the Store Owner user (owner@cody.inc)
 */
@Injectable()
export class MepfServicesSeedService implements ISeedService {
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
    @InjectRepository(ServiceMilestoneTemplateEntity)
    private serviceMilestoneTemplateRepository: Repository<ServiceMilestoneTemplateEntity>,
    @InjectRepository(ServiceGalleryEntity)
    private serviceGalleryRepository: Repository<ServiceGalleryEntity>,
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
    @InjectRepository(FormTemplateEntity)
    private formTemplateRepository: Repository<FormTemplateEntity>,
    @InjectRepository(FormTemplateOptionEntity)
    private formTemplateOptionRepository: Repository<FormTemplateOptionEntity>,
    @InjectRepository(FormTemplateValidationRuleEntity)
    private formTemplateValidationRuleRepository: Repository<FormTemplateValidationRuleEntity>,
  ) {}

  async run(): Promise<void> {
    // Find the Store Owner user (owner@cody.inc)
    const storeOwner = await this.userRepository.findOne({
      where: { email: 'owner@cody.inc' },
    });

    if (!storeOwner) {
      console.log(
        '⚠️  Store Owner user (owner@cody.inc) not found. Skipping MEPF services seed.',
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
      console.log('⚠️  PHP currency not found. Skipping MEPF services seed.');
      return;
    }

    // === 1. Create Seller ===
    if (!seller) {
      seller = await this.sellerRepository.save(
        this.sellerRepository.create({
          id: 5, // Explicitly set seller id to 5 for reviews seeding
          user_id: storeOwner.id,
          store_name: 'MEPF Solutions Provider',
          slug: 'mepf-solutions-provider',
          store_description:
            'Professional MEPF (Mechanical, Electrical, Plumbing, Fire Protection) services for commercial and residential properties. Our certified technicians provide installation, maintenance, and repair services.',
          store_logo_url: null,
          store_banner_url: null,
          business_registration_number: 'REG-2024-MEPF-001',
          business_type: null,
          tax_id: 'TIN-2024-MEPF-001',
          is_verified: true,
          is_active: true,
          sells_products: false,
          sells_services: true,
          auto_accept_bookings: false,
          bio: 'With over 20 years of experience in MEPF services, we provide expert installation, maintenance, and repair services for all mechanical, electrical, plumbing, and fire protection systems.',
          years_of_experience: 20,
          hourly_rate: 750.0,
          max_concurrent_bookings: 3,
          max_daily_bookings: 8,
          service_capacity_hours: 10.0,
          status: StatusEnum.ACTIVE,
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
      console.log('✅ MEPF seller created: MEPF Solutions Provider (ID: 5)');
    } else {
      // If seller exists but doesn't have id 5, log a warning
      if (seller.id !== 5) {
        console.log(
          `⚠️  Seller already exists with ID ${seller.id}. Reviews will be created for this seller ID instead of 5.`,
        );
      } else {
        console.log(
          '✅ Seller already exists for Store Owner with ID 5. Using existing seller.',
        );
      }
    }

    // === 2. Create Seller Schedules (Mon-Sat, 7 AM - 6 PM) ===
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
          start_time: '07:00:00',
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

    // === 3. Get Service Categories ===
    const hvacCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'hvac' },
    });
    const kitchenEquipmentCategory =
      await this.serviceCategoryRepository.findOne({
        where: { code: 'kitchen-equipment' },
      });
    const ventilationSystemsCategory =
      await this.serviceCategoryRepository.findOne({
        where: { code: 'ventilation-systems' },
      });
    const powerDistCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'power-distribution' },
    });
    const waterSupplyCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'water-supply-system' },
    });
    const fireFightingCategory = await this.serviceCategoryRepository.findOne({
      where: { code: 'fire-fighting-system' },
    });

    if (
      !hvacCategory ||
      !kitchenEquipmentCategory ||
      !ventilationSystemsCategory ||
      !powerDistCategory ||
      !waterSupplyCategory ||
      !fireFightingCategory
    ) {
      console.log(
        '⚠️  Required service categories not found. Run service-categories seed first.',
      );
      return;
    }

    // === 4. Create Services ===
    const existingServicesCount = await this.serviceRepository.count({
      where: { seller_id: seller.id },
    });

    const services: ServiceEntity[] = [];

    if (existingServicesCount > 0) {
      console.log(
        '⚠️  Services already exist for this seller. Fetching existing services.',
      );
      const existingServices = await this.serviceRepository.find({
        where: { seller_id: seller.id },
      });
      services.push(...existingServices);
    } else {
      // === Facilities Maintenance Services (Data-seed.md): 4 Maintenance + 4 Diagnostic + 4 General ===

      // 1. Maintenance: Cleaning / replacement of air filters (HVAC) - Schedule: Monthly
      const svc1 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: hvacCategory.id,
          currency_id: phpCurrency.id,
          title: 'Cleaning / Replacement of Air Filters',
          code: 'hvac-air-filter-cleaning-replacement',
          description:
            'Monthly cleaning or replacement of air filters to maintain optimal HVAC performance and air quality. Includes inspection, cleaning reusable filters, or replacement of disposable filters. Schedule recurrence: Monthly.',
          short_description: 'Monthly air filter cleaning and replacement',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 800.0,
          hourly_rate: null,
          estimated_duration_minutes: 60,
          minimum_duration_minutes: 30,
          maximum_duration_minutes: 120,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 8,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.STANDARD,
          is_featured: false,
          requires_quote: true,
          instant_booking: false,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc1);

      // 2. Diagnostic: HVAC fault diagnosis (no cooling, uneven airflow)
      const svc2 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: hvacCategory.id,
          currency_id: phpCurrency.id,
          title: 'HVAC Fault Diagnosis',
          code: 'hvac-fault-diagnosis',
          description:
            'HVAC fault diagnosis for no cooling, uneven airflow, and related issues. Comprehensive inspection and diagnostic report with recommended solutions.',
          short_description:
            'HVAC fault diagnosis (no cooling, uneven airflow)',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2000.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 240,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.ASSESSMENT,
          is_featured: false,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc2);

      // 3. Maintenance: Cleaning and inspection of compressors, condensers, evaporators (Kitchen Equipment)
      const svc3 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: kitchenEquipmentCategory.id,
          currency_id: phpCurrency.id,
          title:
            'Cleaning and Inspection of Compressors, Condensers, Evaporators',
          code: 'kitchen-compressor-condenser-evaporator-cleaning',
          description:
            'Regular cleaning and inspection of refrigeration system components including compressors, condensers, and evaporators. Ensures optimal performance and extends equipment lifespan.',
          short_description:
            'Kitchen equipment compressor, condenser, evaporator cleaning',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1800.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 240,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.STANDARD,
          is_featured: false,
          requires_quote: true,
          instant_booking: false,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc3);

      // 4. Diagnostic: Refrigeration breakdown (Kitchen Equipment)
      const svc4 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: kitchenEquipmentCategory.id,
          currency_id: phpCurrency.id,
          title: 'Refrigeration Breakdown',
          code: 'kitchen-refrigeration-breakdown',
          description:
            'Emergency diagnostic service for refrigeration breakdowns. Comprehensive inspection to identify the root cause and provide detailed assessment with repair recommendations.',
          short_description: 'Refrigeration breakdown diagnosis',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2000.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 240,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 3,
          minimum_notice_hours: 4,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.ASSESSMENT,
          is_featured: false,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc4);

      // 5. Maintenance: Cleaning exhaust fans and kitchen hoods (Ventilation)
      const svc5 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: ventilationSystemsCategory.id,
          currency_id: phpCurrency.id,
          title: 'Cleaning Exhaust Fans and Kitchen Hoods',
          code: 'ventilation-exhaust-fan-hood-cleaning',
          description:
            'Regular cleaning of exhaust fans and kitchen hoods to maintain proper ventilation and prevent fire hazards. Includes removal of grease buildup and inspection of fan operation.',
          short_description: 'Exhaust fan and kitchen hood cleaning',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1500.0,
          hourly_rate: null,
          estimated_duration_minutes: 90,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 180,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 6,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.STANDARD,
          is_featured: false,
          requires_quote: true,
          instant_booking: false,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc5);

      // 6. General: Ventilation fan or exhaust malfunction (no form template)
      const svc6 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: ventilationSystemsCategory.id,
          currency_id: phpCurrency.id,
          title: 'Ventilation Fan or Exhaust Malfunction',
          code: 'ventilation-fan-exhaust-malfunction',
          description:
            'Diagnostic and repair service for ventilation fan or exhaust system malfunctions. Includes electrical testing, mechanical inspection, and airflow analysis.',
          short_description: 'Ventilation fan or exhaust malfunction',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2000.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 240,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.GENERAL,
          service_location_type: ServiceLocationTypeEnum.BOTH,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc6);

      // 7. General: Inspection of wiring, panels, breakers, conduits (Electrical) - no form template
      const svc7 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: powerDistCategory.id,
          currency_id: phpCurrency.id,
          title: 'Inspection of Wiring, Panels, Breakers, Conduits',
          code: 'electrical-inspection-wiring-panels',
          description:
            'Comprehensive inspection of electrical wiring, panels, breakers, and conduits. Ensures safety and identifies potential issues.',
          short_description: 'Electrical system inspection',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1800.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 360,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.GENERAL,
          service_location_type: ServiceLocationTypeEnum.WALK_IN,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc7);

      // 8. Diagnostic: Short circuit or power loss troubleshooting (Electrical)
      const svc8 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: powerDistCategory.id,
          currency_id: phpCurrency.id,
          title: 'Short Circuit or Power Loss Troubleshooting',
          code: 'electrical-short-circuit-power-loss',
          description:
            'Diagnostic service for short circuit or power loss issues. Troubleshooting and assessment with recommended solutions.',
          short_description: 'Short circuit or power loss troubleshooting',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2000.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 240,
          service_radius_km: 30,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.ASSESSMENT,
          is_featured: false,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc8);

      // 9. Maintenance: Cleaning of drains, grease traps, sewage lines (Plumbing) - Quarterly
      const svc9 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: waterSupplyCategory.id,
          currency_id: phpCurrency.id,
          title: 'Cleaning of Drains, Grease Traps, Sewage Lines',
          code: 'plumbing-drain-grease-trap-sewage-cleaning',
          description:
            'Cleaning of drains, grease traps, and sewage lines. Schedule recurrence: Quarterly. Prevents blockages and maintains proper flow.',
          short_description: 'Drain, grease trap, and sewage line cleaning',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2500.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 90,
          maximum_duration_minutes: 300,
          service_radius_km: 25,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.STANDARD,
          is_featured: false,
          requires_quote: true,
          instant_booking: false,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc9);

      // 10. General: Drain blockage clearing (Plumbing) - no form template
      const svc10 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: waterSupplyCategory.id,
          currency_id: phpCurrency.id,
          title: 'Drain Blockage Clearing',
          code: 'plumbing-drain-blockage-clearing',
          description:
            'Reactive service for clearing drain blockages. Quick response to restore proper drainage.',
          short_description: 'Drain blockage clearing',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1500.0,
          hourly_rate: null,
          estimated_duration_minutes: 90,
          minimum_duration_minutes: 45,
          maximum_duration_minutes: 180,
          service_radius_km: 25,
          is_remote_available: false,
          max_bookings_per_day: 6,
          advance_booking_days: 3,
          minimum_notice_hours: 4,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.GENERAL,
          service_location_type: ServiceLocationTypeEnum.HOME_SERVICE,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc10);

      // 11. General: Inspection and testing of fire alarm panels, detectors, sensors - no form template
      const svc11 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: fireFightingCategory.id,
          currency_id: phpCurrency.id,
          title:
            'Inspection and Testing of Fire Alarm Panels, Detectors, Sensors',
          code: 'fire-alarm-inspection-testing',
          description:
            'Inspection and testing of fire alarm panels, detectors, and sensors. Ensures fire safety systems are operational.',
          short_description: 'Fire alarm inspection and testing',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 2000.0,
          hourly_rate: null,
          estimated_duration_minutes: 120,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 240,
          service_radius_km: 35,
          is_remote_available: false,
          max_bookings_per_day: 4,
          advance_booking_days: 14,
          minimum_notice_hours: 24,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.GENERAL,
          service_location_type: ServiceLocationTypeEnum.REMOTE,
          is_featured: true,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc11);

      // 12. Diagnostic: Fire alarm troubleshooting and reset
      const svc12 = await this.serviceRepository.save(
        this.serviceRepository.create({
          seller_id: seller.id,
          category_id: fireFightingCategory.id,
          currency_id: phpCurrency.id,
          title: 'Fire Alarm Troubleshooting and Reset',
          code: 'fire-alarm-troubleshooting-reset',
          description:
            'Diagnostic service for fire alarm troubleshooting and reset. Identifies and resolves alarm system issues.',
          short_description: 'Fire alarm troubleshooting and reset',
          pricing_type: PricingTypeEnum.FIXED,
          base_price: 1800.0,
          hourly_rate: null,
          estimated_duration_minutes: 90,
          minimum_duration_minutes: 60,
          maximum_duration_minutes: 180,
          service_radius_km: 35,
          is_remote_available: false,
          max_bookings_per_day: 5,
          advance_booking_days: 7,
          minimum_notice_hours: 12,
          status: ServiceStatusEnum.ACTIVE,
          service_type: ServiceTypeEnum.ASSESSMENT,
          is_featured: false,
          requires_quote: false,
          instant_booking: true,
          created_by: storeOwner,
          updated_by: storeOwner,
        }),
      );
      services.push(svc12);

      console.log(`✅ ${services.length} MEPF services created (Data-seed.md)`);
    }

    if (services.length === 0) {
      console.log('⚠️  No services found. Skipping dependent data.');
      return;
    }

    // === 5. Create Service Areas ===
    const existingServiceAreasCount = await this.serviceAreaRepository.count({
      where: { seller_id: seller.id },
    });

    if (existingServiceAreasCount > 0) {
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

      // Add service areas for each service
      for (const service of services) {
        // Cebu City - No additional fee
        serviceAreas.push({
          seller_id: seller.id,
          service_id: service.id,
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
        });

        // Mandaue City - Small additional fee
        serviceAreas.push({
          seller_id: seller.id,
          service_id: service.id,
          city: 'Mandaue City',
          province: 'Cebu',
          postal_code: '6014',
          barangay: null,
          center_latitude: 10.3236,
          center_longitude: 123.9223,
          radius_km: 10,
          additional_fee: 150,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 1000,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        });

        // Lapu-Lapu City (Mactan) - Higher additional fee
        serviceAreas.push({
          seller_id: seller.id,
          service_id: service.id,
          city: 'Lapu-Lapu City',
          province: 'Cebu',
          postal_code: '6015',
          barangay: null,
          center_latitude: 10.3103,
          center_longitude: 123.9494,
          radius_km: 12,
          additional_fee: 300,
          additional_fee_type: AdditionalFeeTypeEnum.FIXED,
          minimum_order_amount: 1500,
          status: 'Active',
          created_by: storeOwner,
          updated_by: storeOwner,
        });
      }

      await this.serviceAreaRepository.save(
        serviceAreas.map((a) => this.serviceAreaRepository.create(a)),
      );
      console.log(
        `✅ ${serviceAreas.length} service areas created (3 per service)`,
      );
    }

    // === 6. Create Checklist Templates (DPO Assessment Checklists) ===
    const existingChecklistCount =
      await this.serviceMilestoneTemplateRepository.count({
        where: {
          service_id: services[0]?.id,
          template_type: MilestoneTypeEnum.CHECKLIST,
        },
      });

    if (existingChecklistCount > 0) {
      console.log('⚠️  Checklist templates already exist. Skipping.');
    } else {
      const checklistTemplates: Array<{
        service_id: number;
        package_id: null;
        name: string;
        description: string | null;
        template_type: MilestoneTypeEnum;
        category: string | null;
        response_type: ChecklistResponseTypeEnum;
        measurement_unit: string | null;
        is_required: boolean;
        sequence_order: number;
        estimated_duration_hours: null;
        estimated_duration_days: null;
        payment_percent: number;
        deliverables: null;
        requires_customer_approval: boolean;
        auto_approve_after_hours: number;
        status: ServiceMilestoneTemplateStatusEnum;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // HVAC Service Checklists (services[0])
      if (services[0]) {
        checklistTemplates.push(
          {
            service_id: services[0].id,
            package_id: null,
            name: 'Unit Model & Serial Number',
            description:
              'Record the AC unit model and serial number for documentation',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Equipment Info',
            response_type: ChecklistResponseTypeEnum.TEXT,
            measurement_unit: null,
            is_required: true,
            sequence_order: 100,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[0].id,
            package_id: null,
            name: 'Refrigerant Pressure Check',
            description: 'Measure and record refrigerant pressure (PSI)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Mechanical',
            response_type: ChecklistResponseTypeEnum.MEASUREMENT,
            measurement_unit: 'PSI',
            is_required: true,
            sequence_order: 101,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[0].id,
            package_id: null,
            name: 'Air Filter Condition',
            description: 'Check if air filter needs cleaning or replacement',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Maintenance',
            response_type: ChecklistResponseTypeEnum.CHECKBOX,
            measurement_unit: null,
            is_required: true,
            sequence_order: 102,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[0].id,
            package_id: null,
            name: 'Compressor Condition Rating',
            description: 'Rate the overall compressor condition (1-5)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Mechanical',
            response_type: ChecklistResponseTypeEnum.RATING,
            measurement_unit: null,
            is_required: true,
            sequence_order: 103,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[0].id,
            package_id: null,
            name: 'Before Service Photos',
            description: 'Take photos of the unit before service begins',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.PHOTO,
            measurement_unit: null,
            is_required: true,
            sequence_order: 104,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
        );
      }

      // Electrical Service Checklists (services[1])
      if (services[1]) {
        checklistTemplates.push(
          {
            service_id: services[1].id,
            package_id: null,
            name: 'Main Breaker Amperage',
            description: 'Record the main breaker amperage rating',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Electrical',
            response_type: ChecklistResponseTypeEnum.MEASUREMENT,
            measurement_unit: 'Amps',
            is_required: true,
            sequence_order: 100,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[1].id,
            package_id: null,
            name: 'Grounding System Verified',
            description: 'Verify proper grounding connection',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Safety',
            response_type: ChecklistResponseTypeEnum.CHECKBOX,
            measurement_unit: null,
            is_required: true,
            sequence_order: 101,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[1].id,
            package_id: null,
            name: 'Voltage Reading',
            description: 'Measure and record voltage at main panel',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Electrical',
            response_type: ChecklistResponseTypeEnum.MEASUREMENT,
            measurement_unit: 'Volts',
            is_required: true,
            sequence_order: 102,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[1].id,
            package_id: null,
            name: 'Panel Condition Rating',
            description: 'Rate the overall electrical panel condition (1-5)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Assessment',
            response_type: ChecklistResponseTypeEnum.RATING,
            measurement_unit: null,
            is_required: true,
            sequence_order: 103,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[1].id,
            package_id: null,
            name: 'Additional Notes',
            description: 'Any additional observations or concerns',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.TEXT,
            measurement_unit: null,
            is_required: false,
            sequence_order: 104,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
        );
      }

      // Plumbing Service Checklists (services[2])
      if (services[2]) {
        checklistTemplates.push(
          {
            service_id: services[2].id,
            package_id: null,
            name: 'Water Pressure',
            description: 'Measure water pressure at main line',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Plumbing',
            response_type: ChecklistResponseTypeEnum.MEASUREMENT,
            measurement_unit: 'PSI',
            is_required: true,
            sequence_order: 100,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[2].id,
            package_id: null,
            name: 'Leak Detection Check',
            description: 'Check for visible leaks in the system',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Inspection',
            response_type: ChecklistResponseTypeEnum.CHECKBOX,
            measurement_unit: null,
            is_required: true,
            sequence_order: 101,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[2].id,
            package_id: null,
            name: 'Pipe Material Type',
            description:
              'Document the type of pipe material (PVC, Copper, Galvanized, etc.)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.TEXT,
            measurement_unit: null,
            is_required: true,
            sequence_order: 102,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[2].id,
            package_id: null,
            name: 'Pipe Condition Photos',
            description: 'Take photos of pipe condition and any damage',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.PHOTO,
            measurement_unit: null,
            is_required: true,
            sequence_order: 103,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
        );
      }

      // Fire Protection Service Checklists (services[3])
      if (services[3]) {
        checklistTemplates.push(
          {
            service_id: services[3].id,
            package_id: null,
            name: 'Fire Extinguisher Expiry Check',
            description: 'Verify fire extinguisher is within validity period',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Compliance',
            response_type: ChecklistResponseTypeEnum.CHECKBOX,
            measurement_unit: null,
            is_required: true,
            sequence_order: 100,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[3].id,
            package_id: null,
            name: 'Sprinkler Pressure',
            description: 'Measure sprinkler system pressure',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Fire Safety',
            response_type: ChecklistResponseTypeEnum.MEASUREMENT,
            measurement_unit: 'PSI',
            is_required: true,
            sequence_order: 101,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[3].id,
            package_id: null,
            name: 'Alarm System Functionality',
            description: 'Test and rate alarm system functionality (1-5)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Fire Safety',
            response_type: ChecklistResponseTypeEnum.RATING,
            measurement_unit: null,
            is_required: true,
            sequence_order: 102,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[3].id,
            package_id: null,
            name: 'Equipment Serial Numbers',
            description: 'Document all fire safety equipment serial numbers',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.TEXT,
            measurement_unit: null,
            is_required: true,
            sequence_order: 103,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[3].id,
            package_id: null,
            name: 'System Inspection Photos',
            description: 'Photo documentation of fire protection system',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.PHOTO,
            measurement_unit: null,
            is_required: true,
            sequence_order: 104,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
        );
      }

      // General Handyman Service Checklists (services[4])
      if (services[4]) {
        checklistTemplates.push(
          {
            service_id: services[4].id,
            package_id: null,
            name: 'Job Site Assessment',
            description: 'Describe the work area and any access requirements',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Assessment',
            response_type: ChecklistResponseTypeEnum.TEXT,
            measurement_unit: null,
            is_required: true,
            sequence_order: 100,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[4].id,
            package_id: null,
            name: 'Tools Required Checklist',
            description: 'Confirm all required tools are available',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Preparation',
            response_type: ChecklistResponseTypeEnum.CHECKBOX,
            measurement_unit: null,
            is_required: true,
            sequence_order: 101,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[4].id,
            package_id: null,
            name: 'Before Work Photos',
            description: 'Document condition before work begins',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Documentation',
            response_type: ChecklistResponseTypeEnum.PHOTO,
            measurement_unit: null,
            is_required: true,
            sequence_order: 102,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
          {
            service_id: services[4].id,
            package_id: null,
            name: 'Customer Satisfaction Rating',
            description: 'Rate customer satisfaction after completion (1-5)',
            template_type: MilestoneTypeEnum.CHECKLIST,
            category: 'Quality',
            response_type: ChecklistResponseTypeEnum.RATING,
            measurement_unit: null,
            is_required: false,
            sequence_order: 103,
            estimated_duration_hours: null,
            estimated_duration_days: null,
            payment_percent: 0,
            deliverables: null,
            requires_customer_approval: false,
            auto_approve_after_hours: 0,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
            created_by: storeOwner,
            updated_by: storeOwner,
          },
        );
      }

      await this.serviceMilestoneTemplateRepository.save(
        checklistTemplates.map((c) =>
          this.serviceMilestoneTemplateRepository.create(c),
        ),
      );
      console.log(
        `✅ ${checklistTemplates.length} checklist templates created for MEPF services`,
      );
    }

    // === 7. Create Form Templates (Booking Intake Forms) ===
    const existingFormTemplatesCount = await this.formTemplateRepository.count({
      where: { service_id: services[0]?.id },
    });

    if (existingFormTemplatesCount > 0) {
      console.log('⚠️  Form templates already exist. Skipping.');
    } else {
      // Form templates only for Maintenance + Diagnostic (8 services): indices 0,1,2,3,4,7,8,11 (Data-seed.md)
      const allFormTemplates: FormTemplateEntity[] = [];
      const serviceIndicesWithForm = [0, 1, 2, 3, 4, 7, 8, 11];

      for (const idx of serviceIndicesWithForm) {
        const service = services[idx];
        if (!service) continue;
        const prefix = `service-${service.code}-`;
        const templates = await this.formTemplateRepository.save([
          this.formTemplateRepository.create({
            service_id: service.id,
            name: 'Problem / Request Description',
            code: `${prefix}problem-description`,
            field_type: FormFieldTypeEnum.TEXTAREA,
            is_required: true,
            placeholder: 'Describe the issue or service needed',
            help_text:
              'Provide details about the problem or maintenance request',
            default_value: null,
            sequence_order: 1,
            is_active: true,
            created_by: storeOwner,
            updated_by: storeOwner,
          }),
          this.formTemplateRepository.create({
            service_id: service.id,
            name: 'Preferred Service Date',
            code: `${prefix}preferred-date`,
            field_type: FormFieldTypeEnum.DATE,
            is_required: false,
            placeholder: null,
            help_text: 'When would you like the service to be performed?',
            default_value: null,
            sequence_order: 2,
            is_active: true,
            created_by: storeOwner,
            updated_by: storeOwner,
          }),
        ]);
        allFormTemplates.push(...templates);
      }

      console.log(
        `✅ ${allFormTemplates.length} form templates created for Maintenance & Diagnostic services`,
      );
    }

    // === 8. Create Service Gallery Images ===
    const existingGalleryCount = await this.serviceGalleryRepository.count({
      where: { service_id: services[0]?.id },
    });

    if (existingGalleryCount > 0) {
      console.log('⚠️  Service gallery already exists. Skipping.');
    } else {
      // Image paths from ekumpra-mobile/assets/images/travajo (Data-seed.md)
      const travajoImages = [
        'Hvac-AirConditioning-img.jpg',
        'Hvac-AirConditioning-img.jpg',
        'Kitchen-Equipment-img.jpg',
        'Kitchen-Equipment-img.jpg',
        'Ventilation-System-img.jpg',
        'Ventilation-System-img.jpg',
        'Electrical-img.png',
        'Electrical-img.png',
        'Plumbing-img.png',
        'Plumbing-img.png',
        'GeneralServices-img.png',
        'GeneralServices-img.png',
      ];
      const galleryItems = services.map((service, index) => ({
        service_id: service.id,
        image_url: `assets/images/travajo/${travajoImages[index] ?? 'GeneralServices-img.png'}`,
        caption: service.title,
        alt_text: service.short_description || service.title,
        is_primary: true,
        display_order: 0,
        status: 'Active',
        created_by: storeOwner,
        updated_by: storeOwner,
      }));

      await this.serviceGalleryRepository.save(
        galleryItems.map((g) => this.serviceGalleryRepository.create(g)),
      );
      console.log(`✅ ${galleryItems.length} service gallery images created`);
    }

    console.log('✅ MEPF services seed completed successfully');
  }
}
