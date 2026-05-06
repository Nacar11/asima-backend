import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { PaymentStatusEnum } from '@/sales-orders/domain/payment-status.enum';

const GUEST_BOOKING_PAYMENT_EXPIRY_CRON_EXPRESSION =
  process.env.GUEST_BOOKING_PAYMENT_EXPIRY_CRON || '0 * * * * *';

const EXPIRABLE_PAYMENT_STATUSES: CheckoutPaymentStatusEnum[] = [
  CheckoutPaymentStatusEnum.PENDING,
  CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
];

const EXPIRABLE_GUEST_PAYMENT_METHODS = [
  'gcash',
  'paymaya_direct',
  'unionbank',
] as const;

const CANCELLABLE_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.PENDING,
  BookingStatusEnum.AWAITING_CONFIRMATION,
];

const MUTABLE_ORDER_STATUSES: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
];

interface GuestPaymentExpiryStats {
  paymentExpired: boolean;
  cancelledBookingsCount: number;
  cancelledOrdersCount: number;
}

@Injectable()
export class GuestVenueBookingExpirySchedulerService {
  private readonly logger = new Logger(
    GuestVenueBookingExpirySchedulerService.name,
  );

  constructor(
    @InjectRepository(CheckoutPaymentEntity)
    private readonly checkoutPaymentRepository: Repository<CheckoutPaymentEntity>,
    @InjectRepository(CheckoutPaymentOrderEntity)
    private readonly paymentOrderRepository: Repository<CheckoutPaymentOrderEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
  ) {}

  /**
   * Enforce timeout for one payment immediately (used by live API actions).
   * Returns true only when timeout transitions were applied.
   */
  async expirePaymentIfDue(
    paymentId: number,
    now: Date = new Date(),
  ): Promise<boolean> {
    const payment = await this.checkoutPaymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      return false;
    }

    const result = await this.expireGuestPaymentIfDue(payment, now);
    return result.paymentExpired;
  }

  /**
   * Expire stale guest manual payments and apply timeout outcomes:
   * - unpaid: booking + order cancelled
   */
  @Cron(GUEST_BOOKING_PAYMENT_EXPIRY_CRON_EXPRESSION)
  async expireTimedOutGuestVenuePayments(): Promise<void> {
    const now = new Date();
    const stalePayments = await this.checkoutPaymentRepository
      .createQueryBuilder('payment')
      .where('payment.expires_at IS NOT NULL')
      .andWhere('payment.expires_at <= :now', { now })
      .andWhere('payment.status IN (:...statuses)', {
        statuses: EXPIRABLE_PAYMENT_STATUSES,
      })
      .andWhere('payment.payment_method_code IN (:...paymentMethods)', {
        paymentMethods: [...EXPIRABLE_GUEST_PAYMENT_METHODS],
      })
      .andWhere(`payment.metadata ->> 'guest_booking' = :isGuestBooking`, {
        isGuestBooking: 'true',
      })
      .orderBy('payment.expires_at', 'ASC')
      .getMany();

    if (stalePayments.length === 0) {
      return;
    }

    let expiredPaymentsCount = 0;
    let cancelledBookingsCount = 0;
    let cancelledOrdersCount = 0;

    for (const payment of stalePayments) {
      const result = await this.expireGuestPaymentIfDue(payment, now);
      if (!result.paymentExpired) {
        continue;
      }

      expiredPaymentsCount += 1;
      cancelledBookingsCount += result.cancelledBookingsCount;
      cancelledOrdersCount += result.cancelledOrdersCount;
    }

    this.logger.log(
      `Guest payment expiry job finished. payments_expired=${expiredPaymentsCount}, bookings_cancelled=${cancelledBookingsCount}, orders_cancelled=${cancelledOrdersCount}`,
    );
  }

  private async expireGuestPaymentIfDue(
    payment: CheckoutPaymentEntity,
    now: Date,
  ): Promise<GuestPaymentExpiryStats> {
    if (!this.isGuestManualPayment(payment)) {
      return this.emptyStats();
    }

    if (!EXPIRABLE_PAYMENT_STATUSES.includes(payment.status)) {
      return this.emptyStats();
    }

    if (!payment.expires_at) {
      return this.emptyStats();
    }

    const expiresAt = new Date(payment.expires_at).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt > now.getTime()) {
      return this.emptyStats();
    }

    const timeoutReason = 'Payment window expired without payment submission.';

    const expireResult = await this.checkoutPaymentRepository
      .createQueryBuilder()
      .update(CheckoutPaymentEntity)
      .set({
        status: CheckoutPaymentStatusEnum.EXPIRED,
        failure_reason: timeoutReason,
      } as any)
      .where('id = :id', { id: payment.id })
      .andWhere('status IN (:...statuses)', {
        statuses: EXPIRABLE_PAYMENT_STATUSES,
      })
      .execute();

    if (Number(expireResult.affected || 0) === 0) {
      return this.emptyStats();
    }

    const salesOrderIds = await this.resolveSalesOrderIds(payment);
    if (salesOrderIds.length === 0) {
      this.logger.warn(
        `Expired guest payment ${payment.id} has no linked sales orders.`,
      );
      return {
        paymentExpired: true,
        cancelledBookingsCount: 0,
        cancelledOrdersCount: 0,
      };
    }

    const bookingUpdateResult = await this.bookingRepository
      .createQueryBuilder()
      .update(BookingEntity)
      .set({
        status: BookingStatusEnum.CANCELLED,
        cancelled_at: now,
        cancelled_by: null,
        cancellation_reason: timeoutReason,
        updated_at: now,
      } as any)
      .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
      .andWhere('status IN (:...statuses)', {
        statuses: CANCELLABLE_BOOKING_STATUSES,
      })
      .execute();

    const cancelledBookingsCount = Number(bookingUpdateResult.affected || 0);

    const cancelledOrderReason =
      'Cancelled: payment window expired without payment.';
    const cancelledOrderUpdateResult = await this.salesOrderRepository
      .createQueryBuilder()
      .update(SalesOrderEntity)
      .set({
        status: OrderStatusEnum.CANCELLED,
        payment_status: PaymentStatusEnum.EXPIRED,
        cancellation_reason: cancelledOrderReason,
        cancelled_at: now,
        status_notes: cancelledOrderReason,
        updated_at: now,
      } as any)
      .where('id IN (:...salesOrderIds)', { salesOrderIds })
      .andWhere('status IN (:...statuses)', {
        statuses: MUTABLE_ORDER_STATUSES,
      })
      .execute();

    return {
      paymentExpired: true,
      cancelledBookingsCount,
      cancelledOrdersCount: Number(cancelledOrderUpdateResult.affected || 0),
    };
  }

  private isGuestManualPayment(payment: CheckoutPaymentEntity): boolean {
    const metadata = (payment.metadata || {}) as Record<string, unknown>;
    const guestBookingFlag = metadata.guest_booking;
    const isGuestBooking =
      guestBookingFlag === true ||
      String(guestBookingFlag || '')
        .trim()
        .toLowerCase() === 'true';
    const paymentMethodCode = String(payment.payment_method_code || '')
      .trim()
      .toLowerCase();

    return (
      isGuestBooking &&
      EXPIRABLE_GUEST_PAYMENT_METHODS.includes(
        paymentMethodCode as (typeof EXPIRABLE_GUEST_PAYMENT_METHODS)[number],
      )
    );
  }

  private async resolveSalesOrderIds(
    payment: CheckoutPaymentEntity,
  ): Promise<number[]> {
    const ids = new Set<number>();

    if (
      typeof payment.sales_order_id === 'number' &&
      Number.isFinite(payment.sales_order_id) &&
      payment.sales_order_id > 0
    ) {
      ids.add(payment.sales_order_id);
    }

    const links = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: payment.id },
      select: ['sales_order_id'],
    });

    for (const link of links) {
      if (
        typeof link.sales_order_id === 'number' &&
        Number.isFinite(link.sales_order_id) &&
        link.sales_order_id > 0
      ) {
        ids.add(link.sales_order_id);
      }
    }

    return [...ids];
  }

  private emptyStats(): GuestPaymentExpiryStats {
    return {
      paymentExpired: false,
      cancelledBookingsCount: 0,
      cancelledOrdersCount: 0,
    };
  }
}
