import { NotFoundException } from '@nestjs/common';
import { SubscriptionPaymentsService } from '@/subscription-payments/subscription-payments.service';
import { User } from '@/users/domain/user';

describe('SubscriptionPaymentsService', () => {
  let service: SubscriptionPaymentsService;

  const subscriptionPaymentRepository = {
    findById: jest.fn(),
    findBySubscriptionId: jest.fn(),
    findAllWithPagination: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const subscriptionRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const ownerUser: User = { id: 101, system_admin: false } as User;
  const otherUser: User = { id: 202, system_admin: false } as User;
  const adminUser: User = { id: 303, system_admin: true } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionPaymentsService(
      subscriptionPaymentRepository as never,
      subscriptionRepository as never,
    );
  });

  describe('findByIdForUser', () => {
    it('should allow the subscription owner to fetch their payment', async () => {
      const payment = { id: 4, subscription_id: 44 };
      subscriptionPaymentRepository.findById.mockResolvedValue(payment);
      subscriptionRepository.findById.mockResolvedValue({
        id: 44,
        user_id: ownerUser.id,
      });

      await expect(service.findByIdForUser(4, ownerUser)).resolves.toBe(
        payment,
      );
    });

    it('should allow system admins to fetch any payment', async () => {
      const payment = { id: 4, subscription_id: 44 };
      subscriptionPaymentRepository.findById.mockResolvedValue(payment);

      await expect(service.findByIdForUser(4, adminUser)).resolves.toBe(
        payment,
      );
      expect(subscriptionRepository.findById).not.toHaveBeenCalled();
    });

    it('should hide another user payment from non-admin callers', async () => {
      subscriptionPaymentRepository.findById.mockResolvedValue({
        id: 4,
        subscription_id: 44,
      });
      subscriptionRepository.findById.mockResolvedValue({
        id: 44,
        user_id: ownerUser.id,
      });

      await expect(service.findByIdForUser(4, otherUser)).rejects.toThrow(
        new NotFoundException('Subscription payment does not exist.'),
      );
    });
  });

  describe('findBySubscriptionIdForUser', () => {
    it('should not leak another user subscription payment history', async () => {
      subscriptionRepository.findById.mockResolvedValue({
        id: 77,
        user_id: ownerUser.id,
      });

      await expect(
        service.findBySubscriptionIdForUser(77, otherUser),
      ).rejects.toThrow(
        new NotFoundException('Subscription payment does not exist.'),
      );
      expect(
        subscriptionPaymentRepository.findBySubscriptionId,
      ).not.toHaveBeenCalled();
    });
  });
});
