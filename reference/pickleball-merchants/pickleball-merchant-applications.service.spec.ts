import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PickleballMerchantApplicationsService } from '@/pickleball-merchants/pickleball-merchant-applications.service';
import { StorageService } from '@/storage/storage.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { MailService } from '@/mail/mail.service';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';
import { PickleballMerchantOwnerSetupStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-owner-setup-status.enum';
import { PickleballMerchantSubscriptionPaymentStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-subscription-payment-status.enum';
import { PickleballMerchantOnboardingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-onboarding-status.enum';
import { PickleballMerchantListingStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-listing-status.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';
import { PickleballLocationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-location.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { StatusEnum as SellerStatusEnum } from '@/utils/enums/status-enum';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';

describe('PickleballMerchantApplicationsService', () => {
  let service: PickleballMerchantApplicationsService;

  const applicationRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
    update: jest.fn(),
  };

  const applicationCourtRepository = {
    save: jest.fn(),
    create: jest.fn((payload) => payload),
  };

  const userRepository = {
    find: jest.fn(),
  };

  const subscriptionPlanRepository = {
    findOne: jest.fn(),
  };

  const subscriptionPaymentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((payload) => payload),
    update: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  } as unknown as DataSource;

  const storageService = {
    putBuffer: jest.fn(),
  } as unknown as StorageService;

  const notificationsService = {
    create: jest.fn(),
  } as unknown as NotificationsService;

  const mailService = {
    pickleballMerchantCredentials: jest.fn(),
    pickleballMerchantApplicationSubmittedOwner: jest.fn(),
    pickleballMerchantApplicationSubmittedApprover: jest.fn(),
    pickleballMerchantApplicationSubmittedAdmin: jest.fn(),
    pickleballMerchantApplicationRejected: jest.fn(),
    pickleballMerchantSubscriptionPaymentSubmittedOwner: jest.fn(),
    pickleballMerchantSubscriptionPaymentSubmittedAdmin: jest.fn(),
    pickleballMerchantSubscriptionPaymentApproved: jest.fn(),
    pickleballMerchantSubscriptionPaymentRejected: jest.fn(),
    pickleballMerchantListingPublished: jest.fn(),
  } as unknown as MailService;

  const parseBase64Image = (input: string) =>
    (
      service as unknown as {
        parseBase64Image: (value: string) => {
          buffer: Buffer;
          mimeType: string;
          extension: string;
        };
      }
    ).parseBase64Image(input);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PickleballMerchantApplicationsService(
      applicationRepository as never,
      applicationCourtRepository as never,
      userRepository as never,
      subscriptionPlanRepository as never,
      subscriptionPaymentRepository as never,
      dataSource,
      storageService,
      notificationsService,
      mailService,
    );
  });

  describe('GCash QR validation', () => {
    it('should reject malformed base64 payloads', () => {
      expect(() => parseBase64Image('hello world')).toThrow(
        new BadRequestException('Invalid GCash QR image data.'),
      );
    });

    it('should reject empty decoded images', () => {
      expect(() => parseBase64Image('data:image/png;base64,')).toThrow(
        new BadRequestException('Invalid GCash QR image data.'),
      );
    });

    it('should reject payloads whose contents are not supported image files', () => {
      const fakeImage = Buffer.from('not-an-image').toString('base64');

      expect(() =>
        parseBase64Image(`data:image/png;base64,${fakeImage}`),
      ).toThrow(
        new BadRequestException(
          'GCash QR image must be a PNG, JPEG, or WebP image.',
        ),
      );
    });

    it('should reject payloads whose declared type does not match the file bytes', () => {
      const validPngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      expect(() =>
        parseBase64Image(`data:image/jpeg;base64,${validPngBase64}`),
      ).toThrow(
        new BadRequestException(
          'GCash QR image data does not match its declared file type.',
        ),
      );
    });

    it('should accept a valid PNG payload and normalize its metadata', () => {
      const result = parseBase64Image(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      );

      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('approveApplication', () => {
    it('should provision a pending subscription, pending payment, active venue services, and approval metadata in one transaction', async () => {
      const application = {
        id: 44,
        status: PickleballMerchantApplicationStatusEnum.SUBMITTED,
        merchant_name: 'QA Courts',
        location_name: 'QA Courts Branch',
        merchant_description: 'Indoor courts',
        contact_name: 'QA Owner',
        contact_phone: '+639171234567',
        owner_email: 'owner@example.com',
        approver_email: 'approver@example.com',
        address_line: '123 Example Street',
        province: 'Cebu',
        city: 'Cebu City',
        barangay: 'Mabolo',
        postal_code: '6000',
        latitude: 10.3,
        longitude: 123.9,
        gcash_qr_image_url: 'media/pickleball-merchants/qa/gcash-qr.png',
        courts: [
          { name: 'Court A', description: 'North side' },
          { name: 'Court B', description: 'South side' },
        ],
      };
      const plan = {
        id: 9,
        price: 1499,
        commission_percent: 12,
        billing_cycle: BillingCycleEnum.MONTHLY,
      };
      const causer = { id: 700, system_admin: true } as any;
      const manager = {
        create: jest.fn((_entity, payload) => payload),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn((entity) => {
          if (entity === MenuEntity) {
            return Promise.resolve(
              [
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
              ].map((menuCode, index) => ({
                id: index + 1,
                menu_code: menuCode,
              })),
            );
          }

          return Promise.resolve([]);
        }),
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        })),
        save: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      let nextId = 1000;
      manager.save.mockImplementation((_entity, payload) => ({
        id: nextId++,
        ...payload,
      }));

      applicationRepository.findOne.mockResolvedValue(application);
      userRepository.find.mockResolvedValue([]);
      subscriptionPlanRepository.findOne.mockResolvedValue(plan);
      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(manager),
      );

      jest
        .spyOn(service as any, 'generateTemporaryPassword')
        .mockReturnValueOnce('owner-temp-password')
        .mockReturnValueOnce('approver-temp-password');
      jest
        .spyOn(service as any, 'generateUniqueSellerSlug')
        .mockResolvedValue('qa-courts');
      jest
        .spyOn(service as any, 'generateUniqueLocationKey')
        .mockResolvedValue('qa-courts-branch');
      jest
        .spyOn(service as any, 'createUserForApplication')
        .mockResolvedValueOnce({ id: 501, email: application.owner_email })
        .mockResolvedValueOnce({
          id: 502,
          email: application.approver_email,
        });
      jest
        .spyOn(service as any, 'findOrCreateBookingApproverGroup')
        .mockResolvedValue({ id: 601 });
      jest
        .spyOn(service as any, 'generateUniqueServiceCode')
        .mockResolvedValueOnce('qa-courts-court-a')
        .mockResolvedValueOnce('qa-courts-court-b');
      const sendApprovalCredentialsEmailsSpy = jest
        .spyOn(service as any, 'sendApprovalCredentialsEmails')
        .mockResolvedValue(undefined);
      const findOneForAdminSpy = jest
        .spyOn(service, 'findOneForAdmin')
        .mockResolvedValue({ id: application.id } as any);

      await expect(
        service.approveApplication(
          application.id,
          { subscription_plan_id: plan.id },
          causer,
        ),
      ).resolves.toEqual({ id: application.id });

      const subscriptionSaveCall = manager.save.mock.calls.find(
        ([entity]) => entity === SubscriptionEntity,
      );
      expect(subscriptionSaveCall?.[1]).toEqual(
        expect.objectContaining({
          user_id: 501,
          plan_id: plan.id,
          status: SubscriptionStatusEnum.PENDING_PAYMENT,
        }),
      );

      const subscriptionPaymentSaveCall = manager.save.mock.calls.find(
        ([entity]) => entity === SubscriptionPaymentEntity,
      );
      expect(subscriptionPaymentSaveCall?.[1]).toEqual(
        expect.objectContaining({
          amount: Number(plan.price),
          payment_status: SubscriptionPaymentStatusEnum.PENDING,
          payment_method: null,
        }),
      );

      const serviceSaves = manager.save.mock.calls.filter(
        ([entity]) => entity === ServiceEntity,
      );
      expect(serviceSaves).toHaveLength(2);
      expect(serviceSaves.map(([, payload]) => payload.title)).toEqual([
        'Court A',
        'Court B',
      ]);
      expect(serviceSaves.map(([, payload]) => payload.status)).toEqual([
        ServiceStatusEnum.ACTIVE,
        ServiceStatusEnum.ACTIVE,
      ]);
      expect(serviceSaves.map(([, payload]) => payload.hourly_rate)).toEqual([
        200, 200,
      ]);

      const scheduleSaveCall = manager.save.mock.calls.find(
        ([entity]) => entity === SellerScheduleEntity,
      );
      expect(scheduleSaveCall?.[1]).toHaveLength(7);

      expect(manager.update).toHaveBeenCalledWith(
        PickleballMerchantApplicationEntity,
        application.id,
        expect.objectContaining({
          status: PickleballMerchantApplicationStatusEnum.APPROVED,
          owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.INVITED,
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.NOT_STARTED,
          onboarding_status: PickleballMerchantOnboardingStatusEnum.NOT_STARTED,
          listing_status: PickleballMerchantListingStatusEnum.HIDDEN,
          owner_user_id: 501,
          approver_user_id: 502,
          seller_id: expect.any(Number),
          subscription_id: expect.any(Number),
        }),
      );

      expect(sendApprovalCredentialsEmailsSpy).toHaveBeenCalledWith(
        application,
        'owner-temp-password',
        'approver-temp-password',
      );
      expect(findOneForAdminSpy).toHaveBeenCalledWith(application.id);
    });
  });

  describe('completeOwnerSetup', () => {
    it('should mark owner setup as completed for the merchant owner', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 44,
        status: PickleballMerchantApplicationStatusEnum.APPROVED,
        owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.INVITED,
      });

      const refreshed = {
        id: 44,
        owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
      };
      const findOneForAdminSpy = jest
        .spyOn(service, 'findOneForAdmin')
        .mockResolvedValue(refreshed as any);

      await expect(
        service.completeOwnerSetup({ id: 501 } as any),
      ).resolves.toEqual(refreshed);

      expect(applicationRepository.update).toHaveBeenCalledWith(
        44,
        expect.objectContaining({
          owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
          owner_setup_completed_at: expect.any(Date),
        }),
      );
      expect(findOneForAdminSpy).toHaveBeenCalledWith(44);
    });
  });

  describe('submitSubscriptionPayment', () => {
    it('should upload proof, mark the latest payment as submitted, and update the application review state', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 44,
        status: PickleballMerchantApplicationStatusEnum.APPROVED,
        merchant_name: 'QA Courts',
        owner_setup_status: PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
        subscription_id: 90,
      });
      subscriptionPaymentRepository.findOne.mockResolvedValue({
        id: 701,
        subscription_id: 90,
        amount: 1499,
        payment_status: SubscriptionPaymentStatusEnum.PENDING,
        submitted_at: null,
        billing_cycle_start: new Date('2026-04-01T00:00:00.000Z'),
        billing_cycle_end: new Date('2026-05-01T00:00:00.000Z'),
        due_date: new Date('2026-04-01T00:00:00.000Z'),
      });

      jest
        .spyOn(service as any, 'uploadSubscriptionPaymentProofImage')
        .mockResolvedValue({
          key: 'media/pickleball-merchants/qa/subscription-payments/44/proof.png',
          url: 'http://localhost:9002/media/pickleball-merchants/qa/subscription-payments/44/proof.png',
        });

      const findOneForAdminSpy = jest
        .spyOn(service, 'findOneForAdmin')
        .mockResolvedValue({ id: 44 } as any);

      await expect(
        service.submitSubscriptionPayment({ id: 501 } as any, {
          payment_method: 'gcash',
          payment_reference_number: 'GCASH-12345',
          payment_proof_base64:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
      ).resolves.toEqual({ id: 44 });

      expect(subscriptionPaymentRepository.update).toHaveBeenCalledWith(
        701,
        expect.objectContaining({
          payment_method: 'gcash',
          payment_reference_number: 'GCASH-12345',
          payment_proof_url:
            'http://localhost:9002/media/pickleball-merchants/qa/subscription-payments/44/proof.png',
          payment_proof_key:
            'media/pickleball-merchants/qa/subscription-payments/44/proof.png',
          submitted_at: expect.any(Date),
          reviewed_at: null,
          reviewed_by: null,
          failure_reason: null,
        }),
      );

      expect(applicationRepository.update).toHaveBeenCalledWith(
        44,
        expect.objectContaining({
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW,
          subscription_payment_submitted_at: expect.any(Date),
          subscription_payment_reviewed_at: null,
          subscription_payment_reviewed_by: null,
          subscription_payment_rejection_reason: null,
        }),
      );
      expect(findOneForAdminSpy).toHaveBeenCalledWith(44);
    });
  });

  describe('approveSubmittedSubscriptionPayment', () => {
    it('should mark the payment paid, activate the subscription, and move the application into approved-payment state', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 44,
        subscription_id: 90,
        subscription_payment_status:
          PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW,
      });
      subscriptionPaymentRepository.findOne.mockResolvedValue({
        id: 701,
        subscription_id: 90,
        payment_status: SubscriptionPaymentStatusEnum.PENDING,
        submitted_at: new Date('2026-04-23T09:00:00.000Z'),
      });

      const manager = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(manager),
      );
      const findOneForAdminSpy = jest
        .spyOn(service, 'findOneForAdmin')
        .mockResolvedValue({ id: 44 } as any);

      await expect(
        service.approveSubmittedSubscriptionPayment(44, { id: 700 } as any),
      ).resolves.toEqual({ id: 44 });

      expect(manager.update).toHaveBeenCalledWith(
        SubscriptionPaymentEntity,
        701,
        expect.objectContaining({
          payment_status: SubscriptionPaymentStatusEnum.PAID,
          paid_at: expect.any(Date),
          reviewed_at: expect.any(Date),
          reviewed_by: 700,
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        SubscriptionEntity,
        90,
        expect.objectContaining({
          status: SubscriptionStatusEnum.ACTIVE,
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        PickleballMerchantApplicationEntity,
        44,
        expect.objectContaining({
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
          subscription_payment_reviewed_at: expect.any(Date),
          subscription_payment_reviewed_by: 700,
          subscription_payment_rejection_reason: null,
        }),
      );
      expect(findOneForAdminSpy).toHaveBeenCalledWith(44);
    });
  });

  describe('rejectSubmittedSubscriptionPayment', () => {
    it('should reject the pending payment and allow the owner to resubmit', async () => {
      applicationRepository.findOne.mockResolvedValue({
        id: 44,
        subscription_id: 90,
        review_notes: 'Initial review',
        subscription_payment_status:
          PickleballMerchantSubscriptionPaymentStatusEnum.SUBMITTED_FOR_REVIEW,
      });
      subscriptionPaymentRepository.findOne.mockResolvedValue({
        id: 701,
        subscription_id: 90,
        payment_status: SubscriptionPaymentStatusEnum.PENDING,
        submitted_at: new Date('2026-04-23T09:00:00.000Z'),
      });

      const manager = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(manager),
      );
      const findOneForAdminSpy = jest
        .spyOn(service, 'findOneForAdmin')
        .mockResolvedValue({ id: 44 } as any);

      await expect(
        service.rejectSubmittedSubscriptionPayment(
          44,
          {
            rejection_reason: 'Receipt is blurry',
            review_notes: 'Please upload a clearer screenshot.',
          },
          { id: 700 } as any,
        ),
      ).resolves.toEqual({ id: 44 });

      expect(manager.update).toHaveBeenCalledWith(
        SubscriptionPaymentEntity,
        701,
        expect.objectContaining({
          payment_status: SubscriptionPaymentStatusEnum.FAILED,
          reviewed_at: expect.any(Date),
          reviewed_by: 700,
          failure_reason: 'Receipt is blurry',
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        PickleballMerchantApplicationEntity,
        44,
        expect.objectContaining({
          subscription_payment_status:
            PickleballMerchantSubscriptionPaymentStatusEnum.REJECTED,
          subscription_payment_reviewed_at: expect.any(Date),
          subscription_payment_reviewed_by: 700,
          subscription_payment_rejection_reason: 'Receipt is blurry',
          review_notes: 'Please upload a clearer screenshot.',
        }),
      );
      expect(findOneForAdminSpy).toHaveBeenCalledWith(44);
    });
  });

  describe('publishApplicationIfEligible', () => {
    it('should publish the listing and complete the application when all go-live gates are satisfied', async () => {
      const manager = {
        findOne: jest.fn((entity) => {
          if (entity === PickleballMerchantApplicationEntity) {
            return {
              id: 44,
              subscription_id: 90,
              seller_id: 33,
              owner_setup_status:
                PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
              subscription_payment_status:
                PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
              onboarding_status:
                PickleballMerchantOnboardingStatusEnum.COMPLETED,
            };
          }

          if (entity === SubscriptionEntity) {
            return {
              id: 90,
              status: SubscriptionStatusEnum.ACTIVE,
            };
          }

          if (entity === SellerEntity) {
            return {
              id: 33,
              status: SellerStatusEnum.ACTIVE,
            };
          }

          if (entity === PickleballLocationEntity) {
            return {
              id: 55,
              seller_id: 33,
              status: 'active',
            };
          }

          return null;
        }),
        count: jest.fn().mockResolvedValue(2),
        update: jest.fn().mockResolvedValue(undefined),
      };

      await expect(
        (service as any).publishApplicationIfEligible(manager, 44, {
          id: 700,
        } as any),
      ).resolves.toBeUndefined();

      expect(manager.count).toHaveBeenCalledWith(ServiceEntity, {
        where: {
          seller_id: 33,
          service_type: ServiceTypeEnum.VENUE,
          status: ServiceStatusEnum.ACTIVE,
          deleted_at: expect.anything(),
        },
      });
      expect(manager.update).toHaveBeenCalledWith(
        PickleballMerchantApplicationEntity,
        44,
        expect.objectContaining({
          status: PickleballMerchantApplicationStatusEnum.COMPLETED,
          listing_status: PickleballMerchantListingStatusEnum.PUBLIC,
          listing_published_at: expect.any(Date),
          completed_at: expect.any(Date),
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        PickleballLocationEntity,
        55,
        expect.objectContaining({
          status: 'active',
          updated_by: { id: 700 },
        }),
      );
    });

    it('should reject publication when the subscription is not active', async () => {
      const manager = {
        findOne: jest.fn((entity) => {
          if (entity === PickleballMerchantApplicationEntity) {
            return {
              id: 44,
              subscription_id: 90,
              seller_id: 33,
              owner_setup_status:
                PickleballMerchantOwnerSetupStatusEnum.COMPLETED,
              subscription_payment_status:
                PickleballMerchantSubscriptionPaymentStatusEnum.APPROVED,
              onboarding_status:
                PickleballMerchantOnboardingStatusEnum.COMPLETED,
            };
          }

          if (entity === SubscriptionEntity) {
            return {
              id: 90,
              status: SubscriptionStatusEnum.PENDING_PAYMENT,
            };
          }

          if (entity === SellerEntity) {
            return {
              id: 33,
              status: SellerStatusEnum.ACTIVE,
            };
          }

          if (entity === PickleballLocationEntity) {
            return {
              id: 55,
              seller_id: 33,
              status: 'active',
            };
          }

          return null;
        }),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(undefined),
      };

      await expect(
        (service as any).publishApplicationIfEligible(manager, 44, {
          id: 700,
        } as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Merchant subscription must be active before publishing the listing.',
        ),
      );

      expect(manager.update).not.toHaveBeenCalledWith(
        PickleballMerchantApplicationEntity,
        44,
        expect.anything(),
      );
    });
  });
});
