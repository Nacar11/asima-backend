import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseSubscriptionPaymentRepository } from '@/subscription-payments/persistence/base-subscription-payment.repository';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';
import { SubscriptionPayment } from '@/subscription-payments/domain/subscription-payment';
import { CreateSubscriptionPaymentDto } from '@/subscription-payments/dto/create-subscription-payment.dto';
import { QuerySubscriptionPaymentDto } from '@/subscription-payments/dto/query-subscription-payment.dto';
import { ProcessPaymentDto } from '@/subscription-payments/dto/process-payment.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

@Injectable()
export class SubscriptionPaymentsService {
  constructor(
    private readonly subscriptionPaymentRepository: BaseSubscriptionPaymentRepository,
    private readonly subscriptionRepository: BaseSubscriptionRepository,
  ) {}

  /**
   * Generate payment number: SUBPAY-YYYYMMDD-XXXX
   */
  private generatePaymentNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SUBPAY-${year}${month}${day}-${random}`;
  }

  async create(
    createDto: CreateSubscriptionPaymentDto,
    causer: User,
  ): Promise<SubscriptionPayment> {
    // Validate subscription exists
    const subscription = await this.subscriptionRepository.findById(
      createDto.subscription_id,
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found!');
    }

    return this.subscriptionPaymentRepository.create({
      subscription_id: createDto.subscription_id,
      payment_number: this.generatePaymentNumber(),
      amount: createDto.amount,
      payment_status: SubscriptionPaymentStatusEnum.PENDING,
      payment_method: createDto.payment_method,
      billing_cycle_start: new Date(createDto.billing_cycle_start),
      billing_cycle_end: new Date(createDto.billing_cycle_end),
      due_date: new Date(createDto.due_date),
      retry_count: 0,
      created_by: causer,
      updated_by: causer,
    });
  }

  async findAllWithPagination(
    query: QuerySubscriptionPaymentDto,
  ): Promise<IPaginatedResult<SubscriptionPayment>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);

    return this.subscriptionPaymentRepository.findAllWithPagination({
      filterQuery: query,
      paginationOptions: { page, limit },
    });
  }

  async findById(id: number): Promise<SubscriptionPayment> {
    const payment = await this.subscriptionPaymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundException('Subscription payment not found!');
    }

    return payment;
  }

  private async assertAdminOrSubscriptionOwner(
    subscriptionId: number,
    causer: User,
  ): Promise<void> {
    if (causer.system_admin) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription || subscription.user_id !== causer.id) {
      throw new NotFoundException('Subscription payment does not exist.');
    }
  }

  async findByIdForUser(
    id: number,
    causer: User,
  ): Promise<SubscriptionPayment> {
    const payment = await this.findById(id);
    await this.assertAdminOrSubscriptionOwner(payment.subscription_id, causer);
    return payment;
  }

  async findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SubscriptionPayment[]> {
    return this.subscriptionPaymentRepository.findBySubscriptionId(
      subscriptionId,
    );
  }

  async findBySubscriptionIdForUser(
    subscriptionId: number,
    causer: User,
  ): Promise<SubscriptionPayment[]> {
    await this.assertAdminOrSubscriptionOwner(subscriptionId, causer);
    return this.findBySubscriptionId(subscriptionId);
  }

  async processPayment(
    id: number,
    processDto: ProcessPaymentDto,
    causer: User,
  ): Promise<SubscriptionPayment> {
    const payment = await this.findById(id);

    if (payment.payment_status !== SubscriptionPaymentStatusEnum.PENDING) {
      throw new BadRequestException('Only pending payments can be processed!');
    }

    // Update payment status
    const updatedPayment = await this.subscriptionPaymentRepository.update(id, {
      payment_status: SubscriptionPaymentStatusEnum.PAID,
      transaction_id: processDto.transaction_id,
      payment_method: processDto.payment_method ?? payment.payment_method,
      paid_at: new Date(),
      updated_by: causer,
    });

    // Activate the subscription
    await this.subscriptionRepository.update(payment.subscription_id, {
      status: SubscriptionStatusEnum.ACTIVE,
      updated_by: causer,
    });

    return updatedPayment;
  }

  async markAsFailed(id: number, causer: User): Promise<SubscriptionPayment> {
    const payment = await this.findById(id);

    if (payment.payment_status !== SubscriptionPaymentStatusEnum.PENDING) {
      throw new BadRequestException(
        'Only pending payments can be marked as failed!',
      );
    }

    return this.subscriptionPaymentRepository.update(id, {
      payment_status: SubscriptionPaymentStatusEnum.FAILED,
      updated_by: causer,
    });
  }

  async refund(id: number, causer: User): Promise<SubscriptionPayment> {
    const payment = await this.findById(id);

    if (payment.payment_status !== SubscriptionPaymentStatusEnum.PAID) {
      throw new BadRequestException('Only paid payments can be refunded!');
    }

    return this.subscriptionPaymentRepository.update(id, {
      payment_status: SubscriptionPaymentStatusEnum.REFUNDED,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.subscriptionPaymentRepository.remove(id, causer);
  }
}
