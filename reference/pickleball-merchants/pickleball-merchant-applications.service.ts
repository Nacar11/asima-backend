import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { StorageService } from '@/storage/storage.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { MailService } from '@/mail/mail.service';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';
import { PickleballMerchantApplicationCourtEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application-court.entity';
import { PickleballLocationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-location.entity';
import { SellerPaymentProfileEntity } from '@/pickleball-merchants/persistence/entities/seller-payment-profile.entity';
import { CreatePickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/create-pickleball-merchant-application.dto';
import { SubmitPickleballMerchantApplicationResponseDto } from '@/pickleball-merchants/dto/submit-pickleball-merchant-application-response.dto';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';
import { PickleballMerchantApplicationListItemDto } from '@/pickleball-merchants/dto/pickleball-merchant-application-list-item.dto';
import { PickleballMerchantApplicationDetailDto } from '@/pickleball-merchants/dto/pickleball-merchant-application-detail.dto';
import { ApprovePickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/approve-pickleball-merchant-application.dto';
import { RejectPickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/reject-pickleball-merchant-application.dto';
import { SubmitPickleballMerchantSubscriptionPaymentDto } from '@/pickleball-merchants/dto/submit-pickleball-merchant-subscription-payment.dto';
import { RejectPickleballMerchantSubscriptionPaymentDto } from '@/pickleball-merchants/dto/reject-pickleball-merchant-subscription-payment.dto';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { StoreAddressEntity } from '@/store-addresses/persistence/entities/store-address.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { StatusEnum as UserGroupStatusEnum } from '@/user-groups/user-groups.enum';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { UserSellerAssignmentStatusEnum } from '@/statuses/user-seller-assignment-status.enum';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { StatusEnum as UserPermissionStatusEnum } from '@/user-permissions/user-permissions.enum';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { ALL_PERMISSIONS } from '@/permissions/permission.constants';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { StatusEnum as UserStatusEnum } from '@/users/users.enum';
import { StatusEnum as SellerStatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';

@Injectable()
export class PickleballMerchantApplicationsService {
  private readonly logger = new Logger(
    PickleballMerchantApplicationsService.name,
  );
  private static readonly MERCHANT_OWNER_GROUP_NAME = 'Merchant Owners';
  private static readonly MERCHANT_OWNER_GROUP_DESCRIPTION =
    'Owns independent pickleball merchant store setup and operations';
  private static readonly MERCHANT_OWNER_MENU_CODES = [
    'SM05',
    'SM10',
    'SM11',
    'SM12',
    'SM14',
    'SM15',
    'SM16',
    'SUG1',
    'SMB1',
    'SV01',
    'SW01',
  ];
  private static readonly DEFAULT_SELLER_SCHEDULE_START_TIME = '08:00:00';
  private static readonly DEFAULT_SELLER_SCHEDULE_END_TIME = '22:00:00';
  private static readonly BOOKING_APPROVERS_GROUP_NAME = 'Booking Approvers';
  private static readonly BOOKING_APPROVERS_GROUP_DESCRIPTION =
    'Receives booking payment approval notifications';
  private static readonly ALLOWED_QR_IMAGE_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
  ]);

  constructor(
    @InjectRepository(PickleballMerchantApplicationEntity)
    private readonly applicationRepository: Repository<PickleballMerchantApplicationEntity>,
    @InjectRepository(PickleballMerchantApplicationCourtEntity)
    private readonly applicationCourtRepository: Repository<PickleballMerchantApplicationCourtEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPaymentEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async submitApplication(
    dto: CreatePickleballMerchantApplicationDto,
  ): Promise<SubmitPickleballMerchantApplicationResponseDto> {
    this.validateDistinctEmails(dto.owner_email, dto.approver_email);
    this.validateCourts(dto.courts);
    await this.assertNoConflictingPendingApplication(dto);

    const qrImageKey = await this.uploadGcashQrImage(
      dto.gcash_qr_image_base64,
      dto.merchant_name,
    );

    const application = await this.applicationRepository.save(
      this.applicationRepository.create({
        application_number: this.generateApplicationNumber(),
        merchant_name: dto.merchant_name.trim(),
        location_name: dto.location_name?.trim() || null,
        merchant_description: dto.merchant_description?.trim() || null,
        contact_name: dto.contact_name?.trim() || null,
        contact_phone: dto.contact_phone?.trim() || null,
        owner_email: dto.owner_email.trim().toLowerCase(),
        approver_email: dto.approver_email.trim().toLowerCase(),
        address_line: dto.address_line?.trim() || null,
        province: dto.province?.trim() || null,
        city: dto.city?.trim() || null,
        barangay: dto.barangay?.trim() || null,
        postal_code: dto.postal_code?.trim() || null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        gcash_qr_image_url: qrImageKey,
        status: PickleballMerchantApplicationStatusEnum.SUBMITTED,
      }),
    );

    await this.applicationCourtRepository.save(
      dto.courts.map((court, index) =>
        this.applicationCourtRepository.create({
          application_id: application.id,
          name: court.name.trim(),
          description: court.description?.trim() || null,
          hourly_rate: this.normalizeCourtHourlyRate(court.hourly_rate),
          display_order: court.display_order ?? index,
        }),
      ),
    );

    await this.notifyAdminsOfNewApplication(application);
    await this.sendApplicationSubmittedEmails(application);

    return {
      id: application.id,
      application_number: application.application_number,
      status: application.status,
    };
  }

  async findAllForAdmin(): Promise<PickleballMerchantApplicationListItemDto[]> {
    const applications = await this.applicationRepository.find({
      where: { deleted_at: IsNull() },
      relations: ['subscription'],
      order: { created_at: 'DESC', id: 'DESC' },
    });

    const counts = await this.getCourtCountsByApplicationId(
      applications.map((application) => application.id),
    );

    return applications.map((application) =>
      this.toListDto(application, counts.get(application.id) ?? 0),
    );
  }

  async findOneForAdmin(
    id: number,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);
    return this.toDetailDto(
      application,
      await this.findLatestSubscriptionPayment(application.subscription_id),
    );
  }

  async approveApplication(
    id: number,
    dto: ApprovePickleballMerchantApplicationDto,
    causer: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.status !== PickleballMerchantApplicationStatusEnum.SUBMITTED
    ) {
      throw new BadRequestException(
        'Only submitted applications can be approved.',
      );
    }

    this.validateDistinctEmails(
      application.owner_email,
      application.approver_email,
    );
    await this.assertEmailsAvailableForApproval(application);

    const plan = await this.subscriptionPlanRepository.findOne({
      where: {
        id: dto.subscription_plan_id,
        status: PlanStatusEnum.ACTIVE,
        deleted_at: IsNull(),
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found or inactive.');
    }

    const ownerPassword = this.generateTemporaryPassword();
    const approverPassword = this.generateTemporaryPassword();

    const approvedApplicationId = await this.dataSource.transaction(
      async (manager) => {
        const sellerSlug = await this.generateUniqueSellerSlug(
          manager,
          application.merchant_name,
        );
        const locationName =
          dto.location_name?.trim() ||
          application.location_name ||
          application.merchant_name;
        const locationKey = await this.generateUniqueLocationKey(
          manager,
          dto.location_key?.trim() || locationName,
        );

        const ownerUser = await this.createUserForApplication(manager, {
          email: application.owner_email,
          fullName: application.contact_name,
          fallbackFirstName: 'Merchant',
          fallbackLastName: 'Owner',
          phone: application.contact_phone,
          password: ownerPassword,
          causer,
        });

        const approverUser = await this.createUserForApplication(manager, {
          email: application.approver_email,
          fullName: `${application.merchant_name} Approver`,
          fallbackFirstName: 'Booking',
          fallbackLastName: 'Approver',
          phone: application.contact_phone,
          password: approverPassword,
          causer,
        });

        const seller = await manager.save(
          SellerEntity,
          manager.create(SellerEntity, {
            user_id: ownerUser.id,
            store_name: application.merchant_name,
            slug: sellerSlug,
            store_description: application.merchant_description ?? null,
            contact: application.contact_phone ?? null,
            email: application.owner_email,
            is_verified: true,
            is_active: true,
            sells_products: false,
            sells_services: true,
            is_featured: false,
            auto_accept_bookings: false,
            bio: application.merchant_description ?? null,
            years_of_experience: null,
            hourly_rate: 0,
            commission_rate: Number(plan.commission_percent ?? 0),
            total_sales: 0,
            total_reviews: 0,
            average_rating: 0,
            total_services: 0,
            total_completed_bookings: 0,
            max_concurrent_bookings: 1,
            max_daily_bookings: 8,
            service_capacity_hours: 8,
            status: SellerStatusEnum.ACTIVE,
            pickup_enabled: false,
            pickup_preparation_time: 30,
            pickup_max_concurrent_orders: 10,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          StoreAddressEntity,
          manager.create(StoreAddressEntity, {
            seller_id: seller.id,
            label: 'Main Location',
            address_line: application.address_line ?? null,
            province: application.province ?? null,
            city: application.city ?? null,
            barangay: application.barangay ?? null,
            postal_code: application.postal_code ?? null,
            latitude: application.latitude ?? null,
            longitude: application.longitude ?? null,
            is_default: true,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        const subscriptionStartDate = new Date();
        const subscriptionEndDate = this.calculateEndDate(
          subscriptionStartDate,
          plan.billing_cycle,
        );

        const subscription = await manager.save(
          SubscriptionEntity,
          manager.create(SubscriptionEntity, {
            user_id: ownerUser.id,
            plan_id: plan.id,
            subscription_number: this.generateSubscriptionNumber(),
            status: SubscriptionStatusEnum.PENDING_PAYMENT,
            start_date: subscriptionStartDate,
            end_date: subscriptionEndDate,
            next_billing_date: subscriptionEndDate,
            auto_renew: true,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          SubscriptionPaymentEntity,
          manager.create(SubscriptionPaymentEntity, {
            subscription_id: subscription.id,
            payment_number: this.generateSubscriptionPaymentNumber(),
            amount: Number(plan.price ?? 0),
            payment_status: SubscriptionPaymentStatusEnum.PENDING,
            payment_method: null,
            transaction_id: null,
            billing_cycle_start: subscriptionStartDate,
            billing_cycle_end: subscriptionEndDate,
            due_date: subscriptionStartDate,
            paid_at: null,
            failure_reason: null,
            retry_count: 0,
            next_retry_at: null,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          PickleballLocationEntity,
          manager.create(PickleballLocationEntity, {
            key: locationKey,
            name: locationName,
            subtitle: null,
            store_name: application.merchant_name,
            address_line: application.address_line ?? null,
            province: application.province ?? null,
            city: application.city ?? null,
            barangay: application.barangay ?? null,
            postal_code: application.postal_code ?? null,
            source_type: 'independent_merchant',
            seller_id: seller.id,
            application_id: application.id,
            image_url: null,
            background_image_url: null,
            status: 'active',
            display_order: 100,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          SellerPaymentProfileEntity,
          manager.create(SellerPaymentProfileEntity, {
            seller_id: seller.id,
            gcash_display_name: 'GCash',
            gcash_qr_image_url:
              this.buildPublicImageUrl(application.gcash_qr_image_url) ?? '',
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        const approverGroup = await this.findOrCreateBookingApproverGroup(
          manager,
          seller.id,
          causer,
        );
        const ownerGroup = await this.findOrCreateMerchantOwnerGroup(
          manager,
          seller.id,
          causer,
        );

        await manager.save(
          UserSellerAssignmentEntity,
          manager.create(UserSellerAssignmentEntity, {
            seller_id: seller.id,
            user_id: approverUser.id,
            status: UserSellerAssignmentStatusEnum.Active,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          UserAssignmentEntity,
          manager.create(UserAssignmentEntity, {
            group: { id: ownerGroup.id } as UserGroupEntity,
            user: { id: ownerUser.id } as UserEntity,
            status: UserAssignmentStatusEnum.ACTIVE,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        await manager.save(
          UserAssignmentEntity,
          manager.create(UserAssignmentEntity, {
            group: { id: approverGroup.id } as UserGroupEntity,
            user: { id: approverUser.id } as UserEntity,
            status: UserAssignmentStatusEnum.ACTIVE,
            created_by: { id: causer.id } as UserEntity,
            updated_by: { id: causer.id } as UserEntity,
          }),
        );

        for (const court of application.courts ?? []) {
          const code = await this.generateUniqueServiceCode(
            manager,
            `${sellerSlug}-${court.name}`,
          );

          const courtHourlyRate = this.normalizeCourtHourlyRate(
            court.hourly_rate,
          );

          await manager.save(
            ServiceEntity,
            manager.create(ServiceEntity, {
              seller_id: seller.id,
              category_id: null,
              currency_id: null,
              title: court.name,
              code,
              description: court.description ?? null,
              short_description: court.description ?? null,
              pricing_type: PricingTypeEnum.HOURLY,
              service_type: ServiceTypeEnum.VENUE,
              base_price: courtHourlyRate,
              hourly_rate: courtHourlyRate,
              estimated_duration_minutes: 60,
              minimum_duration_minutes: 60,
              maximum_duration_minutes: 60,
              service_radius_km: null,
              is_remote_available: false,
              service_location_type: ServiceLocationTypeEnum.WALK_IN,
              venue_capacity: 1,
              slot_duration_minutes: 60,
              peak_price_multiplier: null,
              peak_days: null,
              peak_start_time: null,
              peak_end_time: null,
              max_bookings_per_day: null,
              advance_booking_days: 30,
              minimum_notice_hours: 24,
              status: ServiceStatusEnum.ACTIVE,
              is_featured: false,
              requires_quote: false,
              has_checklist: false,
              instant_booking: true,
              view_count: 0,
              total_bookings: 0,
              average_rating: 0,
              total_reviews: 0,
              created_by: { id: causer.id } as UserEntity,
              updated_by: { id: causer.id } as UserEntity,
            }),
          );
        }

        await this.ensureDefaultSellerSchedules(manager, seller.id, causer);

        await manager.update(
          PickleballMerchantApplicationEntity,
          application.id,
          {
            status: PickleballMerchantApplicationStatusEnum.APPROVED,
            owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.INVITED,
            owner_setup_completed_at: null,
            subscription_payment_status:
              PickleballMerchantSubscriptionPaymentStatusEnum.NOT_STARTED,
            subscription_payment_submitted_at: null,
            subscription_payment_reviewed_at: null,
            subscription_payment_reviewed_by: null,
            subscription_payment_rejection_reason: null,
            onboarding_status:
              PickleballMerchantOnboardingStatusEnum.NOT_STARTED,
            onboarding_started_at: null,
            onboarding_completed_at: null,
            onboarding_completed_by: null,
            listing_status: PickleballMerchantListingStatusEnum.HIDDEN,
            listing_published_at: null,
            completed_at: null,
            review_notes: dto.review_notes?.trim() || null,
            rejection_reason: null,
            reviewed_at: new Date(),
            reviewed_by: { id: causer.id } as UserEntity,
            owner_user_id: ownerUser.id,
            approver_user_id: approverUser.id,
            seller_id: seller.id,
            subscription_id: subscription.id,
          },
        );

        return application.id;
      },
    );

    await this.sendMailSafely(
      `approval credentials for merchant application ${application.id}`,
      () =>
        this.sendApprovalCredentialsEmails(
          application,
          ownerPassword,
          approverPassword,
        ),
    );

    return this.findOneForAdmin(approvedApplicationId);
  }

  async rejectApplication(
    id: number,
    dto: RejectPickleballMerchantApplicationDto,
    causer: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.status !== PickleballMerchantApplicationStatusEnum.SUBMITTED
    ) {
      throw new BadRequestException(
        'Only submitted applications can be rejected.',
      );
    }

    await this.applicationRepository.update(id, {
      status: PickleballMerchantApplicationStatusEnum.REJECTED,
      rejection_reason: dto.rejection_reason.trim(),
      review_notes: dto.review_notes?.trim() || null,
      reviewed_at: new Date(),
      reviewed_by: { id: causer.id } as UserEntity,
    });

    await this.sendApplicationRejectedEmails(application, dto.rejection_reason);

    return this.findOneForAdmin(id);
  }

  async findOnboardingForUser(
    currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationForUserOrThrow(
      currentUser.id,
    );
    return this.toDetailDto(
      application,
      await this.findLatestSubscriptionPayment(application.subscription_id),
    );
  }

  async completeOwnerSetup(
    currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findOwnerApplicationForActionOrThrow(
      currentUser.id,
    );

    if (
      application.status !== PickleballMerchantApplicationStatusEnum.APPROVED &&
      application.status !== PickleballMerchantApplicationStatusEnum.COMPLETED
    ) {
      throw new BadRequestException(
        'Owner setup can only be completed for approved merchant applications.',
      );
    }

    if (
      application.owner_setup_status !==
      PickleballMerchantOwnerSetupStatusEnum.COMPLETED
    ) {
      await this.applicationRepository.update(application.id, {
        owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
        owner_setup_completed_at: new Date(),
      });
    }

    return this.findOneForAdmin(application.id);
  }

  async submitSubscriptionPayment(
    currentUser: User,
    dto: SubmitPickleballMerchantSubscriptionPaymentDto,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findOwnerApplicationForActionOrThrow(
      currentUser.id,
    );

    if (
      application.owner_setup_status !==
      PickleballMerchantOwnerSetupStatusEnum.COMPLETED
    ) {
      throw new BadRequestException(
        'Complete owner account setup before submitting subscription payment.',
      );
    }

    if (!application.subscription_id) {
      throw new BadRequestException(
        'Merchant subscription is not ready for payment submission.',
      );
    }

    if (
      application.subscription_payment_status ===
      PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED
    ) {
      throw new BadRequestException(
        'Subscription payment has already been approved.',
      );
    }

    const latestPayment = await this.findLatestSubscriptionPayment(
      application.subscription_id,
    );
    if (!latestPayment) {
      throw new BadRequestException(
        'No subscription payment was prepared for this merchant yet.',
      );
    }

    if (
      latestPayment.payment_status === SubscriptionPaymentStatusEnum.PAID ||
      latestPayment.payment_status === SubscriptionPaymentStatusEnum.REFUNDED
    ) {
      throw new BadRequestException(
        'The latest merchant subscription payment cannot be resubmitted.',
      );
    }

    if (
      latestPayment.payment_status === SubscriptionPaymentStatusEnum.PENDING &&
      latestPayment.submitted_at
    ) {
      throw new BadRequestException(
        'A merchant subscription payment is already awaiting admin review.',
      );
    }

    const proofUpload = await this.uploadSubscriptionPaymentProofImage(
      dto.payment_proof_base64,
      application.id,
      application.merchant_name,
    );
    const now = new Date();

    let paymentToUpdate = latestPayment;
    if (latestPayment.payment_status === SubscriptionPaymentStatusEnum.FAILED) {
      paymentToUpdate = await this.subscriptionPaymentRepository.save(
        this.subscriptionPaymentRepository.create({
          subscription_id: latestPayment.subscription_id,
          payment_number: this.generateSubscriptionPaymentNumber(),
          amount: latestPayment.amount,
          payment_status: SubscriptionPaymentStatusEnum.PENDING,
          transaction_id: null,
          payment_method: null,
          payment_reference_number: null,
          payment_proof_url: null,
          payment_proof_key: null,
          billing_cycle_start: latestPayment.billing_cycle_start,
          billing_cycle_end: latestPayment.billing_cycle_end,
          due_date: latestPayment.due_date,
          paid_at: null,
          submitted_at: null,
          reviewed_at: null,
          reviewed_by: null,
          failure_reason: null,
          retry_count: 0,
          next_retry_at: null,
          created_by: { id: currentUser.id } as UserEntity,
          updated_by: { id: currentUser.id } as UserEntity,
        }),
      );
    }

    await this.subscriptionPaymentRepository.update(paymentToUpdate.id, {
      payment_method: dto.payment_method?.trim() || 'gcash',
      payment_reference_number: dto.payment_reference_number?.trim() || null,
      payment_proof_url: proofUpload.url,
      payment_proof_key: proofUpload.key,
      submitted_at: now,
      reviewed_at: null,
      reviewed_by: null,
      failure_reason: null,
      updated_by: { id: currentUser.id } as UserEntity,
    });

    await this.applicationRepository.update(application.id, {
      subscription_payment_status:
        PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW,
      subscription_payment_submitted_at: now,
      subscription_payment_reviewed_at: null,
      subscription_payment_reviewed_by: null,
      subscription_payment_rejection_reason: null,
    });

    const updated = await this.findOneForAdmin(application.id);
    await this.sendSubscriptionPaymentSubmittedEmails(updated);
    return updated;
  }

  async approveSubmittedSubscriptionPayment(
    id: number,
    causer: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.subscription_payment_status !==
      PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW
    ) {
      throw new BadRequestException(
        'Only submitted merchant subscription payments can be approved.',
      );
    }

    if (!application.subscription_id) {
      throw new BadRequestException('Merchant subscription does not exist.');
    }

    const payment = await this.findLatestSubmittedPendingPaymentOrThrow(
      application.subscription_id,
    );
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager.update(SubscriptionPaymentEntity, payment.id, {
        payment_status: SubscriptionPaymentStatusEnum.PAID,
        paid_at: now,
        reviewed_at: now,
        reviewed_by: causer.id,
        updated_by: { id: causer.id } as UserEntity,
      });

      await manager.update(SubscriptionEntity, application.subscription_id, {
        status: SubscriptionStatusEnum.ACTIVE,
        updated_by: { id: causer.id } as UserEntity,
      });

      await manager.update(
        PickleballMerchantApplicationEntity,
        application.id,
        {
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
          subscription_payment_reviewed_at: now,
          subscription_payment_reviewed_by: causer.id,
          subscription_payment_rejection_reason: null,
        },
      );
    });

    const updated = await this.findOneForAdmin(application.id);
    await this.sendSubscriptionPaymentApprovedEmails(updated);
    return updated;
  }

  async rejectSubmittedSubscriptionPayment(
    id: number,
    dto: RejectPickleballMerchantSubscriptionPaymentDto,
    causer: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.subscription_payment_status !==
      PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW
    ) {
      throw new BadRequestException(
        'Only submitted merchant subscription payments can be rejected.',
      );
    }

    if (!application.subscription_id) {
      throw new BadRequestException('Merchant subscription does not exist.');
    }

    const payment = await this.findLatestSubmittedPendingPaymentOrThrow(
      application.subscription_id,
    );
    const now = new Date();
    const rejectionReason = dto.rejection_reason.trim();

    await this.dataSource.transaction(async (manager) => {
      await manager.update(SubscriptionPaymentEntity, payment.id, {
        payment_status: SubscriptionPaymentStatusEnum.FAILED,
        reviewed_at: now,
        reviewed_by: causer.id,
        failure_reason: rejectionReason,
        updated_by: { id: causer.id } as UserEntity,
      });

      await manager.update(
        PickleballMerchantApplicationEntity,
        application.id,
        {
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.REJECTED,
          subscription_payment_reviewed_at: now,
          subscription_payment_reviewed_by: causer.id,
          subscription_payment_rejection_reason: rejectionReason,
          review_notes: dto.review_notes?.trim() || application.review_notes,
        },
      );
    });

    const updated = await this.findOneForAdmin(application.id);
    await this.sendSubscriptionPaymentRejectedEmails(updated);
    return updated;
  }

  async markOnboardingInProgress(
    id: number,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.subscription_payment_status !==
      PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED
    ) {
      throw new BadRequestException(
        'Merchant onboarding can only start after payment approval.',
      );
    }

    await this.applicationRepository.update(application.id, {
      onboarding_status: PickleballMerchantOnboardingStatusEnum.IN_PROGRESS,
      onboarding_started_at: application.onboarding_started_at ?? new Date(),
      review_notes: application.review_notes,
    });

    return this.findOneForAdmin(application.id);
  }

  async markOnboardingComplete(
    id: number,
    causer: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    const application = await this.findApplicationOrThrow(id);

    if (
      application.subscription_payment_status !==
      PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED
    ) {
      throw new BadRequestException(
        'Merchant onboarding can only be completed after payment approval.',
      );
    }

    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        PickleballMerchantApplicationEntity,
        application.id,
        {
          onboarding_status: PickleballMerchantOnboardingStatusEnum.COMPLETED,
          onboarding_started_at: application.onboarding_started_at ?? now,
          onboarding_completed_at: now,
          onboarding_completed_by: causer.id,
        },
      );

      await this.publishApplicationIfEligible(manager, application.id, causer);
    });

    const updated = await this.findOneForAdmin(application.id);
    if (updated.listing_status === PickleballMerchantListingStatusEnum.PUBLIC) {
      await this.sendListingPublishedEmails(updated);
    }
    return updated;
  }

  private async findApplicationForUserOrThrow(
    userId: number,
  ): Promise<PickleballMerchantApplicationEntity> {
    const application = await this.applicationRepository.findOne({
      where: [
        { owner_user_id: userId, deleted_at: IsNull() },
        { approver_user_id: userId, deleted_at: IsNull() },
      ],
      relations: ['courts', 'subscription', 'reviewed_by'],
      order: {
        courts: {
          display_order: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'No pickleball merchant onboarding record was found for this account.',
      );
    }

    return application;
  }

  private async findOwnerApplicationForActionOrThrow(
    userId: number,
  ): Promise<PickleballMerchantApplicationEntity> {
    const application = await this.applicationRepository.findOne({
      where: { owner_user_id: userId, deleted_at: IsNull() },
      relations: ['courts', 'subscription', 'reviewed_by'],
      order: {
        courts: {
          display_order: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'No owner-managed pickleball merchant onboarding record was found for this account.',
      );
    }

    return application;
  }

  private async findLatestSubscriptionPayment(
    subscriptionId: number | null | undefined,
  ): Promise<SubscriptionPaymentEntity | null> {
    if (!subscriptionId) {
      return null;
    }

    return this.subscriptionPaymentRepository.findOne({
      where: { subscription_id: subscriptionId, deleted_at: IsNull() },
      order: { id: 'DESC' },
    });
  }

  private async findLatestSubmittedPendingPaymentOrThrow(
    subscriptionId: number,
  ): Promise<SubscriptionPaymentEntity> {
    const payment = await this.subscriptionPaymentRepository.findOne({
      where: {
        subscription_id: subscriptionId,
        payment_status: SubscriptionPaymentStatusEnum.PENDING,
        deleted_at: IsNull(),
      },
      order: { id: 'DESC' },
    });

    if (!payment || !payment.submitted_at) {
      throw new BadRequestException(
        'No submitted merchant subscription payment is awaiting review.',
      );
    }

    return payment;
  }

  private validateDistinctEmails(ownerEmail: string, approverEmail: string) {
    if (
      ownerEmail.trim().toLowerCase() === approverEmail.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        'Owner and approver emails must be different.',
      );
    }
  }

  private validateCourts(
    courts: CreatePickleballMerchantApplicationDto['courts'],
  ) {
    if (!courts || courts.length === 0) {
      throw new BadRequestException('At least one court is required.');
    }
  }

  private async assertNoConflictingPendingApplication(
    dto: CreatePickleballMerchantApplicationDto,
  ) {
    const existing = await this.applicationRepository.findOne({
      where: [
        {
          owner_email: dto.owner_email.trim().toLowerCase(),
          status: PickleballMerchantApplicationStatusEnum.SUBMITTED,
          deleted_at: IsNull(),
        },
        {
          approver_email: dto.approver_email.trim().toLowerCase(),
          status: PickleballMerchantApplicationStatusEnum.SUBMITTED,
          deleted_at: IsNull(),
        },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'There is already a pending merchant application using one of these emails.',
      );
    }
  }

  private async assertEmailsAvailableForApproval(
    application: PickleballMerchantApplicationEntity,
  ) {
    const existingUsers = await this.userRepository.find({
      where: [
        {
          email: application.owner_email,
          deleted_at: IsNull(),
        },
        {
          email: application.approver_email,
          deleted_at: IsNull(),
        },
      ],
      select: ['id', 'email'],
    });

    if (existingUsers.length > 0) {
      const emails = existingUsers.map((user) => user.email).join(', ');
      throw new ConflictException(
        `The following email(s) already belong to existing accounts: ${emails}`,
      );
    }
  }

  private generateApplicationNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = crypto.randomInt(1000, 10000);
    return `PMA-${year}${month}${day}-${random}`;
  }

  private generateSubscriptionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = crypto.randomInt(1000, 10000);
    return `SUB-${year}${month}${day}-${random}`;
  }

  private generateSubscriptionPaymentNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = crypto.randomInt(1000, 10000);
    return `SUBPAY-${year}${month}${day}-${random}`;
  }

  private calculateEndDate(
    startDate: Date,
    billingCycle: BillingCycleEnum,
  ): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case BillingCycleEnum.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycleEnum.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycleEnum.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  private generateTemporaryPassword(): string {
    return crypto.randomBytes(6).toString('base64url');
  }

  private slugify(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSellerSlug(
    manager: EntityManager,
    input: string,
  ): Promise<string> {
    const base = this.slugify(input) || 'merchant';
    let attempt = base;
    let suffix = 2;

    while (
      await manager.findOne(SellerEntity, {
        where: { slug: attempt, deleted_at: IsNull() },
        select: ['id'],
      })
    ) {
      attempt = `${base}-${suffix++}`;
    }

    return attempt;
  }

  private async generateUniqueLocationKey(
    manager: EntityManager,
    input: string,
  ): Promise<string> {
    const base = this.slugify(input) || 'partner-court';
    let attempt = base;
    let suffix = 2;

    while (true) {
      const [existingLocation, existingEdistrict] = await Promise.all([
        manager.findOne(PickleballLocationEntity, {
          where: { key: attempt, deleted_at: IsNull() },
          select: ['id'],
        }),
        manager.findOne(EdistrictEntity, {
          where: { key: attempt, deleted_at: IsNull() },
          select: ['id'],
        }),
      ]);

      if (!existingLocation && !existingEdistrict) {
        return attempt;
      }

      attempt = `${base}-${suffix++}`;
    }
  }

  private async generateUniqueServiceCode(
    manager: EntityManager,
    input: string,
  ): Promise<string> {
    const base = this.slugify(input) || 'court';
    let attempt = base;
    let suffix = 2;

    while (
      await manager.findOne(ServiceEntity, {
        where: { code: attempt, deleted_at: IsNull() },
        select: ['id'],
      })
    ) {
      attempt = `${base}-${suffix++}`;
    }

    return attempt;
  }

  private splitName(
    fullName: string | null | undefined,
    fallbackFirstName: string,
    fallbackLastName: string,
  ): { firstName: string; lastName: string } {
    const normalized = String(fullName || '').trim();
    if (!normalized) {
      return { firstName: fallbackFirstName, lastName: fallbackLastName };
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: fallbackLastName };
    }

    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  }

  private async createUserForApplication(
    manager: EntityManager,
    params: {
      email: string;
      fullName?: string | null;
      fallbackFirstName: string;
      fallbackLastName: string;
      phone?: string | null;
      password: string;
      causer: User;
    },
  ): Promise<UserEntity> {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(params.password, salt);
    const name = this.splitName(
      params.fullName,
      params.fallbackFirstName,
      params.fallbackLastName,
    );

    return manager.save(
      UserEntity,
      manager.create(UserEntity, {
        user_id: `${Date.now()}${crypto.randomInt(100, 1000)}`,
        email: params.email.trim().toLowerCase(),
        password,
        salt,
        first_name: name.firstName,
        last_name: name.lastName,
        phone: params.phone?.trim() || null,
        is_guest: false,
        email_verified: true,
        phone_verified: false,
        system_admin: false,
        image: null,
        status: UserStatusEnum.ACTIVE,
        must_change_password: true,
        created_by: { id: params.causer.id } as UserEntity,
        updated_by: { id: params.causer.id } as UserEntity,
      }),
    );
  }

  private async findOrCreateBookingApproverGroup(
    manager: EntityManager,
    sellerId: number,
    causer: User,
  ): Promise<UserGroupEntity> {
    const existing = await manager.findOne(UserGroupEntity, {
      where: {
        seller_id: sellerId,
        group_name:
          PickleballMerchantApplicationsService.BOOKING_APPROVERS_GROUP_NAME,
        deleted_at: IsNull(),
      },
    });

    if (existing) {
      return existing;
    }

    return manager.save(
      UserGroupEntity,
      manager.create(UserGroupEntity, {
        seller_id: sellerId,
        group_name:
          PickleballMerchantApplicationsService.BOOKING_APPROVERS_GROUP_NAME,
        description:
          PickleballMerchantApplicationsService.BOOKING_APPROVERS_GROUP_DESCRIPTION,
        status: UserGroupStatusEnum.ACTIVE,
        created_by: { id: causer.id } as UserEntity,
        updated_by: { id: causer.id } as UserEntity,
      }),
    );
  }

  private async findOrCreateMerchantOwnerGroup(
    manager: EntityManager,
    sellerId: number,
    causer: User,
  ): Promise<UserGroupEntity> {
    let group = await manager.findOne(UserGroupEntity, {
      where: {
        seller_id: sellerId,
        group_name:
          PickleballMerchantApplicationsService.MERCHANT_OWNER_GROUP_NAME,
        deleted_at: IsNull(),
      },
    });

    if (!group) {
      group = await manager.save(
        UserGroupEntity,
        manager.create(UserGroupEntity, {
          seller_id: sellerId,
          group_name:
            PickleballMerchantApplicationsService.MERCHANT_OWNER_GROUP_NAME,
          description:
            PickleballMerchantApplicationsService.MERCHANT_OWNER_GROUP_DESCRIPTION,
          status: UserGroupStatusEnum.ACTIVE,
          created_by: { id: causer.id } as UserEntity,
          updated_by: { id: causer.id } as UserEntity,
        }),
      );
    }

    await this.ensureMerchantOwnerGroupPermissions(manager, group, causer);

    return group;
  }

  private async ensureMerchantOwnerGroupPermissions(
    manager: EntityManager,
    group: UserGroupEntity,
    causer: User,
  ): Promise<void> {
    const menus = await manager.find(MenuEntity, {
      where: {
        menu_code: In(
          PickleballMerchantApplicationsService.MERCHANT_OWNER_MENU_CODES,
        ),
        deleted_at: IsNull(),
      },
    });

    const menusByCode = new Map(menus.map((menu) => [menu.menu_code, menu]));
    const missingMenuCodes =
      PickleballMerchantApplicationsService.MERCHANT_OWNER_MENU_CODES.filter(
        (code) => !menusByCode.has(code),
      );

    if (missingMenuCodes.length > 0) {
      this.logger.warn(
        `Merchant owner group ${group.id} could not attach missing menu code(s): ${missingMenuCodes.join(', ')}`,
      );
    }

    const existingPermissions = await manager
      .createQueryBuilder(UserPermissionEntity, 'permission')
      .leftJoinAndSelect('permission.menu', 'menu')
      .where('permission.group_id = :groupId', { groupId: group.id })
      .andWhere('permission.deleted_at IS NULL')
      .getMany();

    const existingMenuCodes = new Set(
      existingPermissions.map((permission) => permission.menu?.menu_code),
    );

    const permissionsToCreate = menus
      .filter((menu) => !existingMenuCodes.has(menu.menu_code))
      .map((menu) =>
        manager.create(UserPermissionEntity, {
          group: { id: group.id } as UserGroupEntity,
          menu: { id: menu.id } as MenuEntity,
          permissions: ALL_PERMISSIONS,
          status: UserPermissionStatusEnum.ACTIVE,
          created_by: { id: causer.id } as UserEntity,
          updated_by: { id: causer.id } as UserEntity,
        }),
      );

    if (permissionsToCreate.length > 0) {
      await manager.save(UserPermissionEntity, permissionsToCreate);
    }
  }

  private async ensureDefaultSellerSchedules(
    manager: EntityManager,
    sellerId: number,
    causer: User,
  ): Promise<void> {
    const existingSchedules = await manager.find(SellerScheduleEntity, {
      where: {
        seller_id: sellerId,
      },
      select: {
        day_of_week: true,
      },
    });

    const existingDays = new Set(
      existingSchedules.map((schedule) => schedule.day_of_week),
    );

    const schedulesToCreate = Array.from(
      { length: 7 },
      (_, dayOfWeek) => dayOfWeek,
    )
      .filter((dayOfWeek) => !existingDays.has(dayOfWeek))
      .map((dayOfWeek) =>
        manager.create(SellerScheduleEntity, {
          seller_id: sellerId,
          day_of_week: dayOfWeek,
          status: 'Active',
          start_time:
            PickleballMerchantApplicationsService.DEFAULT_SELLER_SCHEDULE_START_TIME,
          end_time:
            PickleballMerchantApplicationsService.DEFAULT_SELLER_SCHEDULE_END_TIME,
          break_start: null,
          break_end: null,
          created_by: { id: causer.id } as UserEntity,
          updated_by: { id: causer.id } as UserEntity,
        }),
      );

    if (schedulesToCreate.length > 0) {
      await manager.save(SellerScheduleEntity, schedulesToCreate);
    }
  }

  private async uploadGcashQrImage(
    input: string,
    merchantName: string,
  ): Promise<string> {
    const parsed = this.parseBase64Image(input);
    const objectKey = `media/pickleball-merchants/${this.slugify(merchantName) || 'merchant'}/gcash-qr-${Date.now()}.${parsed.extension}`;
    const upload = await this.storageService.putBuffer(
      parsed.buffer,
      objectKey,
      parsed.mimeType,
    );

    return upload.key;
  }

  private async uploadSubscriptionPaymentProofImage(
    input: string,
    applicationId: number,
    merchantName: string,
  ): Promise<{ key: string; url: string }> {
    const parsed = this.parseBase64Image(input);
    const objectKey = `media/pickleball-merchants/${this.slugify(merchantName) || 'merchant'}/subscription-payments/${applicationId}/proof-${Date.now()}.${parsed.extension}`;
    const upload = await this.storageService.putBuffer(
      parsed.buffer,
      objectKey,
      parsed.mimeType,
    );

    return {
      key: upload.key,
      url: this.buildPublicImageUrl(upload.key) ?? upload.url,
    };
  }

  private parseBase64Image(input: string): {
    buffer: Buffer;
    mimeType: string;
    extension: string;
  } {
    const value = String(input || '').trim();
    if (!value) {
      throw new BadRequestException('GCash QR image is required.');
    }

    let mimeType = 'image/png';
    let base64Data = value;

    const dataUriMatch = value.match(
      /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/,
    );
    if (dataUriMatch) {
      mimeType = dataUriMatch[1]
        .toLowerCase()
        .replace('image/jpg', 'image/jpeg');
      base64Data = dataUriMatch[2];
    }

    if (
      dataUriMatch &&
      !PickleballMerchantApplicationsService.ALLOWED_QR_IMAGE_MIME_TYPES.has(
        mimeType,
      )
    ) {
      throw new BadRequestException(
        'GCash QR image must be a PNG, JPEG, or WebP image.',
      );
    }

    const sanitizedBase64 = base64Data.replace(/\s+/g, '');
    if (
      !sanitizedBase64 ||
      sanitizedBase64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(sanitizedBase64)
    ) {
      throw new BadRequestException('Invalid GCash QR image data.');
    }

    const buffer = Buffer.from(sanitizedBase64, 'base64');
    if (!buffer.length) {
      throw new BadRequestException('Invalid GCash QR image data.');
    }

    const detectedMimeType = this.detectSupportedImageMimeType(buffer);
    if (!detectedMimeType) {
      throw new BadRequestException(
        'GCash QR image must be a PNG, JPEG, or WebP image.',
      );
    }

    if (dataUriMatch && mimeType !== detectedMimeType) {
      throw new BadRequestException(
        'GCash QR image data does not match its declared file type.',
      );
    }

    mimeType = detectedMimeType;
    const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

    return { buffer, mimeType, extension };
  }

  private detectSupportedImageMimeType(buffer: Buffer): string | null {
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a &&
      buffer.subarray(12, 16).toString('ascii') === 'IHDR'
    ) {
      return 'image/png';
    }

    if (
      buffer.length >= 4 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[buffer.length - 2] === 0xff &&
      buffer[buffer.length - 1] === 0xd9
    ) {
      return 'image/jpeg';
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    return null;
  }

  private async notifyAdminsOfNewApplication(
    application: PickleballMerchantApplicationEntity,
  ): Promise<void> {
    const admins = await this.findActiveSystemAdmins();

    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create({
          user_id: admin.id,
          type: NotificationTypeEnum.MERCHANT_APPLICATION_SUBMITTED,
          title: 'New pickleball merchant application',
          body: `${application.merchant_name} submitted an independent court provider application.`,
          entity_type: 'merchant_application',
          entity_id: application.id,
          action_url: `/en/admin/pickleball-merchant-applications?applicationId=${application.id}`,
        }),
      ),
    );
  }

  private async findActiveSystemAdmins(): Promise<UserEntity[]> {
    return this.userRepository.find({
      where: {
        system_admin: true,
        status: UserStatusEnum.ACTIVE,
        deleted_at: IsNull(),
      },
      select: ['id', 'email'],
    });
  }

  private async sendApplicationSubmittedEmails(
    application: PickleballMerchantApplicationEntity,
  ): Promise<void> {
    await this.sendMailSafely(
      `application submitted owner email for merchant application ${application.id}`,
      () =>
        this.mailService.pickleballMerchantApplicationSubmittedOwner({
          to: application.owner_email,
          data: {
            merchantName: application.merchant_name,
            applicationNumber: application.application_number,
          },
        }),
    );

    if (application.approver_email) {
      await this.sendMailSafely(
        `application submitted approver email for merchant application ${application.id}`,
        () =>
          this.mailService.pickleballMerchantApplicationSubmittedApprover({
            to: application.approver_email,
            data: {
              merchantName: application.merchant_name,
              applicationNumber: application.application_number,
            },
          }),
      );
    }

    const admins = await this.findActiveSystemAdmins();
    await Promise.all(
      admins
        .filter((admin) => Boolean(admin.email))
        .map((admin) =>
          this.sendMailSafely(
            `application submitted admin email for merchant application ${application.id} to admin ${admin.id}`,
            () =>
              this.mailService.pickleballMerchantApplicationSubmittedAdmin({
                to: admin.email,
                data: {
                  merchantName: application.merchant_name,
                  applicationNumber: application.application_number,
                  ownerEmail: application.owner_email,
                  applicationId: application.id,
                },
              }),
          ),
        ),
    );
  }

  private async sendApplicationRejectedEmails(
    application: PickleballMerchantApplicationEntity,
    rejectionReason: string,
  ): Promise<void> {
    await Promise.all([
      this.sendMailSafely(
        `application rejected owner email for merchant application ${application.id}`,
        () =>
          this.mailService.pickleballMerchantApplicationRejected({
            to: application.owner_email,
            data: {
              merchantName: application.merchant_name,
              applicationNumber: application.application_number,
              rejectionReason,
            },
          }),
      ),
      this.sendMailSafely(
        `application rejected approver email for merchant application ${application.id}`,
        () =>
          this.mailService.pickleballMerchantApplicationRejected({
            to: application.approver_email,
            data: {
              merchantName: application.merchant_name,
              applicationNumber: application.application_number,
              rejectionReason,
            },
          }),
      ),
    ]);
  }

  private async sendSubscriptionPaymentSubmittedEmails(
    application: PickleballMerchantApplicationDetailDto,
  ): Promise<void> {
    const payment = application.latest_payment;
    if (!payment) return;

    await this.sendMailSafely(
      `subscription payment submitted owner email for merchant application ${application.id}`,
      () =>
        this.mailService.pickleballMerchantSubscriptionPaymentSubmittedOwner({
          to: application.owner_email,
          data: {
            merchantName: application.merchant_name,
            applicationNumber: application.application_number,
            paymentNumber: payment.payment_number,
            amount: payment.amount,
          },
        }),
    );

    const admins = await this.findActiveSystemAdmins();
    await Promise.all(
      admins
        .filter((admin) => Boolean(admin.email))
        .map((admin) =>
          this.sendMailSafely(
            `subscription payment submitted admin email for merchant application ${application.id} to admin ${admin.id}`,
            () =>
              this.mailService.pickleballMerchantSubscriptionPaymentSubmittedAdmin(
                {
                  to: admin.email,
                  data: {
                    merchantName: application.merchant_name,
                    applicationNumber: application.application_number,
                    paymentNumber: payment.payment_number,
                    amount: payment.amount,
                    paymentMethod: payment.payment_method,
                    referenceNumber: payment.payment_reference_number,
                    applicationId: application.id,
                  },
                },
              ),
          ),
        ),
    );
  }

  private async sendSubscriptionPaymentApprovedEmails(
    application: PickleballMerchantApplicationDetailDto,
  ): Promise<void> {
    await this.sendMailSafely(
      `subscription payment approved owner email for merchant application ${application.id}`,
      () =>
        this.mailService.pickleballMerchantSubscriptionPaymentApproved({
          to: application.owner_email,
          data: {
            merchantName: application.merchant_name,
            applicationNumber: application.application_number,
          },
        }),
    );
  }

  private async sendSubscriptionPaymentRejectedEmails(
    application: PickleballMerchantApplicationDetailDto,
  ): Promise<void> {
    await this.sendMailSafely(
      `subscription payment rejected owner email for merchant application ${application.id}`,
      () =>
        this.mailService.pickleballMerchantSubscriptionPaymentRejected({
          to: application.owner_email,
          data: {
            merchantName: application.merchant_name,
            applicationNumber: application.application_number,
            rejectionReason:
              application.subscription_payment_rejection_reason ||
              application.latest_payment?.failure_reason ||
              'The submitted payment proof could not be approved.',
          },
        }),
    );
  }

  private async sendListingPublishedEmails(
    application: PickleballMerchantApplicationDetailDto,
  ): Promise<void> {
    await Promise.all([
      this.sendMailSafely(
        `listing published owner email for merchant application ${application.id}`,
        () =>
          this.mailService.pickleballMerchantListingPublished({
            to: application.owner_email,
            data: {
              merchantName: application.merchant_name,
              applicationNumber: application.application_number,
            },
          }),
      ),
      this.sendMailSafely(
        `listing published approver email for merchant application ${application.id}`,
        () =>
          this.mailService.pickleballMerchantListingPublished({
            to: application.approver_email,
            data: {
              merchantName: application.merchant_name,
              applicationNumber: application.application_number,
            },
          }),
      ),
    ]);
  }

  private async sendMailSafely(
    description: string,
    send: () => Promise<void>,
  ): Promise<void> {
    try {
      await send();
    } catch (error) {
      this.logger.error(
        `Failed to send ${description}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendApprovalCredentialsEmails(
    application: PickleballMerchantApplicationEntity,
    ownerPassword: string,
    approverPassword: string,
  ): Promise<void> {
    await Promise.all([
      this.mailService.pickleballMerchantCredentials({
        to: application.owner_email,
        data: {
          merchantName: application.merchant_name,
          recipientRole: 'Owner',
          temporaryPassword: ownerPassword,
        },
      }),
      this.mailService.pickleballMerchantCredentials({
        to: application.approver_email,
        data: {
          merchantName: application.merchant_name,
          recipientRole: 'Approver',
          temporaryPassword: approverPassword,
        },
      }),
    ]);
  }

  private async findApplicationOrThrow(
    id: number,
  ): Promise<PickleballMerchantApplicationEntity> {
    const application = await this.applicationRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['courts', 'subscription', 'reviewed_by'],
      order: {
        courts: {
          display_order: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Merchant application not found.');
    }

    return application;
  }

  private async getCourtCountsByApplicationId(
    applicationIds: number[],
  ): Promise<Map<number, number>> {
    if (applicationIds.length === 0) {
      return new Map();
    }

    const rows = await this.applicationCourtRepository
      .createQueryBuilder('court')
      .select('court.application_id', 'application_id')
      .addSelect('COUNT(*)', 'count')
      .where('court.application_id IN (:...applicationIds)', { applicationIds })
      .groupBy('court.application_id')
      .getRawMany<{ application_id: string; count: string }>();

    return new Map(
      rows.map((row) => [Number(row.application_id), Number(row.count)]),
    );
  }

  private toListDto(
    application: PickleballMerchantApplicationEntity,
    courtsCount: number,
  ): PickleballMerchantApplicationListItemDto {
    return {
      id: application.id,
      application_number: application.application_number,
      merchant_name: application.merchant_name,
      location_name: application.location_name,
      owner_email: application.owner_email,
      approver_email: application.approver_email,
      city: application.city,
      province: application.province,
      status: application.status,
      owner_setup_status: application.owner_setup_status,
      subscription_payment_status: application.subscription_payment_status,
      onboarding_status: application.onboarding_status,
      listing_status: application.listing_status,
      seller_id: application.seller_id,
      subscription_id: application.subscription_id,
      subscription_status: application.subscription?.status ?? null,
      courts_count: courtsCount,
      created_at: application.created_at,
      reviewed_at: application.reviewed_at,
    };
  }

  private toDetailDto(
    application: PickleballMerchantApplicationEntity,
    latestPayment?: SubscriptionPaymentEntity | null,
  ): PickleballMerchantApplicationDetailDto {
    return {
      id: application.id,
      application_number: application.application_number,
      merchant_name: application.merchant_name,
      location_name: application.location_name,
      merchant_description: application.merchant_description,
      contact_name: application.contact_name,
      contact_phone: application.contact_phone,
      owner_email: application.owner_email,
      approver_email: application.approver_email,
      address_line: application.address_line,
      province: application.province,
      city: application.city,
      barangay: application.barangay,
      postal_code: application.postal_code,
      latitude:
        application.latitude !== null && application.latitude !== undefined
          ? Number(application.latitude)
          : null,
      longitude:
        application.longitude !== null && application.longitude !== undefined
          ? Number(application.longitude)
          : null,
      gcash_qr_image_url: this.buildPublicImageUrl(
        application.gcash_qr_image_url,
      ),
      status: application.status,
      owner_setup_status: application.owner_setup_status,
      owner_setup_completed_at: application.owner_setup_completed_at,
      subscription_payment_status: application.subscription_payment_status,
      subscription_payment_submitted_at:
        application.subscription_payment_submitted_at,
      subscription_payment_reviewed_at:
        application.subscription_payment_reviewed_at,
      subscription_payment_reviewed_by:
        application.subscription_payment_reviewed_by,
      subscription_payment_rejection_reason:
        application.subscription_payment_rejection_reason,
      onboarding_status: application.onboarding_status,
      onboarding_started_at: application.onboarding_started_at,
      onboarding_completed_at: application.onboarding_completed_at,
      onboarding_completed_by: application.onboarding_completed_by,
      listing_status: application.listing_status,
      listing_published_at: application.listing_published_at,
      completed_at: application.completed_at,
      review_notes: application.review_notes,
      rejection_reason: application.rejection_reason,
      reviewed_at: application.reviewed_at,
      reviewed_by_id: application.reviewed_by?.id ?? null,
      owner_user_id: application.owner_user_id,
      approver_user_id: application.approver_user_id,
      seller_id: application.seller_id,
      subscription_id: application.subscription_id,
      subscription_status: application.subscription?.status ?? null,
      latest_payment: latestPayment
        ? {
            id: latestPayment.id,
            payment_number: latestPayment.payment_number,
            amount: Number(latestPayment.amount),
            payment_status: latestPayment.payment_status,
            payment_method: latestPayment.payment_method,
            payment_reference_number:
              latestPayment.payment_reference_number ?? null,
            payment_proof_url:
              latestPayment.payment_proof_url ||
              this.buildPublicImageUrl(latestPayment.payment_proof_key),
            submitted_at: latestPayment.submitted_at,
            reviewed_at: latestPayment.reviewed_at,
            reviewed_by: latestPayment.reviewed_by,
            failure_reason: latestPayment.failure_reason,
            paid_at: latestPayment.paid_at,
          }
        : null,
      courts: (application.courts ?? [])
        .slice()
        .sort(
          (left, right) =>
            left.display_order - right.display_order || left.id - right.id,
        )
        .map((court) => ({
          id: court.id,
          name: court.name,
          description: court.description,
          hourly_rate: Number(court.hourly_rate ?? 0),
          display_order: court.display_order,
        })),
      created_at: application.created_at,
      updated_at: application.updated_at,
    };
  }

  private normalizeCourtHourlyRate(rate: number | null | undefined): number {
    const parsed = Number(rate);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 200;
    }
    return Math.round(parsed * 100) / 100;
  }

  private buildPublicImageUrl(
    imageUrl: string | null | undefined,
  ): string | null {
    if (!imageUrl) return null;

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('assets/')
    ) {
      return imageUrl;
    }

    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'media';
    const encodedPath = imageUrl
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return imageUrl.startsWith(`${bucket}/`)
      ? `${publicEndpoint}/${encodedPath}`
      : `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  private async publishApplicationIfEligible(
    manager: EntityManager,
    applicationId: number,
    causer: User,
  ): Promise<void> {
    const application = await manager.findOne(
      PickleballMerchantApplicationEntity,
      {
        where: { id: applicationId, deleted_at: IsNull() },
      },
    );

    if (!application) {
      throw new NotFoundException('Merchant application not found.');
    }

    if (
      application.owner_setup_status !==
        PickleballMerchantOwnerSetupStatusEnum.COMPLETED ||
      application.subscription_payment_status !==
        PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED ||
      application.onboarding_status !==
        PickleballMerchantOnboardingStatusEnum.COMPLETED
    ) {
      throw new BadRequestException(
        'Merchant application is not ready for public listing yet.',
      );
    }

    const [subscription, seller, location, activeVenueCount] =
      await Promise.all([
        application.subscription_id
          ? manager.findOne(SubscriptionEntity, {
              where: {
                id: application.subscription_id,
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        application.seller_id
          ? manager.findOne(SellerEntity, {
              where: { id: application.seller_id, deleted_at: IsNull() },
            })
          : Promise.resolve(null),
        application.seller_id
          ? manager.findOne(PickleballLocationEntity, {
              where: {
                seller_id: application.seller_id,
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        application.seller_id
          ? manager.count(ServiceEntity, {
              where: {
                seller_id: application.seller_id,
                service_type: ServiceTypeEnum.VENUE,
                status: ServiceStatusEnum.ACTIVE,
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(0),
      ]);

    if (
      !subscription ||
      subscription.status !== SubscriptionStatusEnum.ACTIVE
    ) {
      throw new BadRequestException(
        'Merchant subscription must be active before publishing the listing.',
      );
    }

    if (!seller || seller.status !== SellerStatusEnum.ACTIVE) {
      throw new BadRequestException(
        'Merchant seller must remain active before publishing the listing.',
      );
    }

    if (!location || location.status !== 'active') {
      throw new BadRequestException(
        'Merchant location must be active before publishing the listing.',
      );
    }

    if (activeVenueCount === 0) {
      throw new BadRequestException(
        'At least one active venue service is required before publishing the listing.',
      );
    }

    const now = new Date();
    await manager.update(PickleballMerchantApplicationEntity, application.id, {
      status: PickleballMerchantApplicationStatusEnum.COMPLETED,
      listing_status: PickleballMerchantListingStatusEnum.PUBLIC,
      listing_published_at: now,
      completed_at: now,
      updated_at: now,
    });

    await manager.update(PickleballLocationEntity, location.id, {
      status: 'active',
      updated_by: { id: causer.id } as UserEntity,
    });
  }
}
