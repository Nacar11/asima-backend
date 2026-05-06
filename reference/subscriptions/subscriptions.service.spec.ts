import { NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '@/subscriptions/subscriptions.service';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { User } from '@/users/domain/user';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const subscriptionRepository = {
    findById: jest.fn(),
    findActiveByUserId: jest.fn(),
    findByUserId: jest.fn(),
    findAllWithPagination: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    findByNumber: jest.fn(),
  };

  const subscriptionPlanRepository = {
    findById: jest.fn(),
  };

  const subscriptionPaymentRepository = {
    findBySubscriptionId: jest.fn(),
    update: jest.fn(),
  };

  const sellerRepository = {
    findByUserId: jest.fn(),
  };

  const productRepository = {
    findAll: jest.fn(),
  };

  const serviceRepository = {
    findAll: jest.fn(),
  };

  const sellerMemberRepository = {
    findAll: jest.fn(),
  };

  const bookingRepository = {
    findBySellerAndMonth: jest.fn(),
  };

  const ownerUser: User = { id: 101, system_admin: false } as User;
  const otherUser: User = { id: 202, system_admin: false } as User;
  const adminUser: User = { id: 303, system_admin: true } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionsService(
      subscriptionRepository as never,
      subscriptionPlanRepository as never,
      subscriptionPaymentRepository as never,
      sellerRepository as never,
      productRepository as never,
      serviceRepository as never,
      sellerMemberRepository as never,
      bookingRepository as never,
    );
  });

  describe('findByIdForUser', () => {
    it('should allow the subscription owner to fetch their record', async () => {
      const subscription = {
        id: 7,
        user_id: ownerUser.id,
      };
      subscriptionRepository.findById.mockResolvedValue(subscription);

      await expect(service.findByIdForUser(7, ownerUser)).resolves.toBe(
        subscription,
      );
    });

    it('should allow system admins to fetch any subscription', async () => {
      const subscription = {
        id: 7,
        user_id: ownerUser.id,
      };
      subscriptionRepository.findById.mockResolvedValue(subscription);

      await expect(service.findByIdForUser(7, adminUser)).resolves.toBe(
        subscription,
      );
    });

    it('should hide another user subscription from non-admin callers', async () => {
      subscriptionRepository.findById.mockResolvedValue({
        id: 7,
        user_id: ownerUser.id,
      });

      await expect(service.findByIdForUser(7, otherUser)).rejects.toThrow(
        new NotFoundException('Subscription not found!'),
      );
    });
  });

  describe('activate', () => {
    it('should activate the subscription and mark the latest pending payment as paid', async () => {
      const activatedSubscription = {
        id: 9,
        status: SubscriptionStatusEnum.ACTIVE,
      };
      subscriptionRepository.findById.mockResolvedValue({
        id: 9,
        status: SubscriptionStatusEnum.PENDING_PAYMENT,
      });
      subscriptionRepository.update.mockResolvedValue(activatedSubscription);
      subscriptionPaymentRepository.findBySubscriptionId.mockResolvedValue([
        {
          id: 11,
          subscription_id: 9,
          payment_status: SubscriptionPaymentStatusEnum.PENDING,
          payment_method: null,
        },
        {
          id: 18,
          subscription_id: 9,
          payment_status: SubscriptionPaymentStatusEnum.PENDING,
          payment_method: 'dragonpay_gcash',
        },
      ]);

      await expect(service.activate(9, adminUser)).resolves.toBe(
        activatedSubscription,
      );

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({
          status: SubscriptionStatusEnum.ACTIVE,
          updated_by: adminUser,
        }),
      );
      expect(subscriptionPaymentRepository.update).toHaveBeenCalledWith(
        18,
        expect.objectContaining({
          payment_status: SubscriptionPaymentStatusEnum.PAID,
          payment_method: 'dragonpay_gcash',
          updated_by: adminUser,
          paid_at: expect.any(Date),
        }),
      );
    });

    it('should fall back to the admin manual activation label when the pending payment has no method yet', async () => {
      subscriptionRepository.findById.mockResolvedValue({
        id: 12,
        status: SubscriptionStatusEnum.PENDING_PAYMENT,
      });
      subscriptionRepository.update.mockResolvedValue({
        id: 12,
        status: SubscriptionStatusEnum.ACTIVE,
      });
      subscriptionPaymentRepository.findBySubscriptionId.mockResolvedValue([
        {
          id: 21,
          subscription_id: 12,
          payment_status: SubscriptionPaymentStatusEnum.PENDING,
          payment_method: null,
        },
      ]);

      await service.activate(12, adminUser);

      expect(subscriptionPaymentRepository.update).toHaveBeenCalledWith(
        21,
        expect.objectContaining({
          payment_status: SubscriptionPaymentStatusEnum.PAID,
          payment_method: 'admin_manual_activation',
          updated_by: adminUser,
          paid_at: expect.any(Date),
        }),
      );
    });
  });
});
