import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';
import { BaseSubscriptionPaymentRepository } from '@/subscription-payments/persistence/base-subscription-payment.repository';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { BaseSellerMemberRepository } from '@/seller-members/persistence/base-seller-member.repository';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { Subscription } from '@/subscriptions/domain/subscription';
import { SubscriptionUsage } from '@/subscriptions/domain/subscription-usage';
import { CreateSubscriptionDto } from '@/subscriptions/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '@/subscriptions/dto/update-subscription.dto';
import { QuerySubscriptionDto } from '@/subscriptions/dto/query-subscription.dto';
import { CancelSubscriptionDto } from '@/subscriptions/dto/cancel-subscription.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionRepository: BaseSubscriptionRepository,
    private readonly subscriptionPlanRepository: BaseSubscriptionPlanRepository,
    private readonly subscriptionPaymentRepository: BaseSubscriptionPaymentRepository,
    private readonly sellerRepository: BaseSellerRepository,
    private readonly productRepository: BaseProductRepository,
    private readonly serviceRepository: BaseServiceRepository,
    private readonly sellerMemberRepository: BaseSellerMemberRepository,
    private readonly bookingRepository: BaseBookingRepository,
  ) {}

  /**
   * Generate subscription number: SUB-YYYYMMDD-XXXX
   */
  private generateSubscriptionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SUB-${year}${month}${day}-${random}`;
  }

  /**
   * Calculate end date based on billing cycle
   */
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

  async subscribe(
    createDto: CreateSubscriptionDto,
    causer: User,
  ): Promise<Subscription> {
    // Check if user already has an active subscription
    const existingSubscription =
      await this.subscriptionRepository.findActiveByUserId(causer.id);
    if (existingSubscription) {
      throw new UnprocessableEntityException(
        'User already has an active subscription. Please cancel the current subscription first.',
      );
    }

    // Validate plan exists and is active
    const plan = await this.subscriptionPlanRepository.findById(
      createDto.plan_id,
    );
    if (!plan) {
      throw new NotFoundException('Subscription plan not found!');
    }
    if (plan.status !== 'active') {
      throw new BadRequestException('Subscription plan is not available!');
    }

    const startDate = createDto.start_date
      ? new Date(createDto.start_date)
      : new Date();
    const endDate = this.calculateEndDate(startDate, plan.billing_cycle);
    const nextBillingDate = new Date(endDate);

    return this.subscriptionRepository.create({
      user_id: causer.id,
      plan_id: createDto.plan_id,
      subscription_number: this.generateSubscriptionNumber(),
      status: SubscriptionStatusEnum.PENDING_PAYMENT, // Will be activated after payment
      start_date: startDate,
      end_date: endDate,
      next_billing_date: nextBillingDate,
      auto_renew: createDto.auto_renew ?? true,
      created_by: causer,
      updated_by: causer,
    });
  }

  async findAllWithPagination(
    query: QuerySubscriptionDto,
  ): Promise<IPaginatedResult<Subscription>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);

    return this.subscriptionRepository.findAllWithPagination({
      filterQuery: query,
      paginationOptions: { page, limit },
    });
  }

  async findById(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found!');
    }

    return subscription;
  }

  private assertAdminOrSubscriptionOwner(
    subscription: Subscription,
    causer: User,
  ): void {
    if (causer.system_admin) {
      return;
    }

    if (subscription.user_id !== causer.id) {
      throw new NotFoundException('Subscription not found!');
    }
  }

  async findByIdForUser(id: number, causer: User): Promise<Subscription> {
    const subscription = await this.findById(id);
    this.assertAdminOrSubscriptionOwner(subscription, causer);
    return subscription;
  }

  async findMySubscription(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findActiveByUserId(userId);
  }

  async findByUserId(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.findByUserId(userId);
  }

  async update(
    id: number,
    updateDto: UpdateSubscriptionDto,
    causer: User,
  ): Promise<Subscription> {
    await this.findById(id);

    return this.subscriptionRepository.update(id, {
      ...updateDto,
      updated_by: causer,
    });
  }

  async cancel(
    id: number,
    cancelDto: CancelSubscriptionDto,
    causer: User,
  ): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled!');
    }

    return this.subscriptionRepository.update(id, {
      status: SubscriptionStatusEnum.CANCELLED,
      cancelled_at: new Date(),
      cancelled_by: causer,
      cancellation_reason: cancelDto.cancellation_reason,
      auto_renew: false,
      updated_by: causer,
    });
  }

  async cancelForUser(
    id: number,
    cancelDto: CancelSubscriptionDto,
    causer: User,
  ): Promise<Subscription> {
    const subscription = await this.findById(id);
    this.assertAdminOrSubscriptionOwner(subscription, causer);
    return this.cancel(id, cancelDto, causer);
  }

  async renew(id: number, causer: User): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (
      subscription.status !== SubscriptionStatusEnum.EXPIRED &&
      subscription.status !== SubscriptionStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(
        'Only expired or cancelled subscriptions can be renewed!',
      );
    }

    // Get plan to calculate new dates
    const plan = await this.subscriptionPlanRepository.findById(
      subscription.plan_id,
    );
    if (!plan) {
      throw new NotFoundException('Subscription plan not found!');
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billing_cycle);
    const nextBillingDate = new Date(endDate);

    return this.subscriptionRepository.update(id, {
      status: SubscriptionStatusEnum.PENDING_PAYMENT,
      start_date: startDate,
      end_date: endDate,
      next_billing_date: nextBillingDate,
      cancelled_at: null,
      cancelled_by: null,
      cancellation_reason: null,
      auto_renew: true,
      updated_by: causer,
    });
  }

  async renewForUser(id: number, causer: User): Promise<Subscription> {
    const subscription = await this.findById(id);
    this.assertAdminOrSubscriptionOwner(subscription, causer);
    return this.renew(id, causer);
  }

  async activate(id: number, causer: User): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (subscription.status !== SubscriptionStatusEnum.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Only pending payment subscriptions can be activated!',
      );
    }

    const activatedSubscription = await this.subscriptionRepository.update(id, {
      status: SubscriptionStatusEnum.ACTIVE,
      updated_by: causer,
    });

    const pendingPayments =
      await this.subscriptionPaymentRepository.findBySubscriptionId(id);
    const latestPendingPayment = pendingPayments
      .filter(
        (payment) =>
          payment.payment_status === SubscriptionPaymentStatusEnum.PENDING,
      )
      .sort((a, b) => b.id - a.id)[0];

    if (latestPendingPayment) {
      await this.subscriptionPaymentRepository.update(latestPendingPayment.id, {
        payment_status: SubscriptionPaymentStatusEnum.PAID,
        paid_at: new Date(),
        payment_method:
          latestPendingPayment.payment_method ?? 'admin_manual_activation',
        updated_by: causer,
      });
    }

    return activatedSubscription;
  }

  async suspend(id: number, causer: User): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (subscription.status !== SubscriptionStatusEnum.ACTIVE) {
      throw new BadRequestException(
        'Only active subscriptions can be suspended!',
      );
    }

    return this.subscriptionRepository.update(id, {
      status: SubscriptionStatusEnum.SUSPENDED,
      auto_renew: false,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: number[], causer: User): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    for (const id of ids) {
      await this.findById(id);
    }
    for (const id of ids) {
      await this.remove(id, causer);
    }
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.subscriptionRepository.remove(id, causer);
  }

  /**
   * Get subscription usage stats for a user.
   *
   * Returns current usage vs plan limits for the user's active subscription.
   *
   * @param userId - User ID
   * @returns Subscription usage statistics
   */
  async getUsage(userId: number): Promise<SubscriptionUsage> {
    const subscription = await this.findMySubscription(userId);

    // Default zero usage for users without subscription
    if (!subscription) {
      return {
        sellers_used: 0,
        sellers_limit: 0,
        products_used: 0,
        products_limit: 0,
        services_used: 0,
        services_limit: 0,
        members_used: 0,
        members_limit: 0,
        bookings_this_month: 0,
        bookings_limit: 0,
      };
    }

    // Get the user's seller if they have one
    const seller = await this.sellerRepository.findByUserId(userId);
    const sellerId = seller?.id;

    // Get current month for booking count
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get counts
    const [sellersResult, productsResult, servicesResult, membersResult] =
      await Promise.all([
        // Count sellers (just check if user has a seller)
        seller ? 1 : 0,
        // Count products for this seller
        sellerId
          ? this.productRepository.findAll({
              sellerId,
              skip: 0,
              take: 1,
            })
          : { totalCount: 0 },
        // Count services for this seller
        sellerId
          ? this.serviceRepository.findAll({ seller_id: sellerId })
          : { totalCount: 0 },
        // Count members for this seller
        sellerId
          ? this.sellerMemberRepository.findAll({ seller_id: sellerId })
          : { data: [], totalCount: 0 },
      ]);

    // Get monthly bookings count
    let bookingsThisMonth = 0;
    if (sellerId) {
      const monthlyBookings = await this.bookingRepository.findBySellerAndMonth(
        sellerId,
        currentYear,
        currentMonth,
      );
      bookingsThisMonth = monthlyBookings?.length || 0;
    }

    // Get plan limits (may need to fetch plan details)
    const plan = subscription.plan_id
      ? await this.subscriptionPlanRepository.findById(subscription.plan_id)
      : null;

    return {
      sellers_used: typeof sellersResult === 'number' ? sellersResult : 0,
      sellers_limit: plan?.max_sellers ?? null,
      products_used:
        typeof productsResult === 'object' ? productsResult.totalCount : 0,
      products_limit: plan?.max_products ?? null,
      services_used:
        typeof servicesResult === 'object' ? servicesResult.totalCount : 0,
      services_limit: plan?.max_services ?? null,
      members_used:
        typeof membersResult === 'object' && 'totalCount' in membersResult
          ? membersResult.totalCount
          : 0,
      members_limit: plan?.max_members ?? null,
      bookings_this_month: bookingsThisMonth,
      bookings_limit: null, // Bookings limit not defined in plan schema
    };
  }
}
