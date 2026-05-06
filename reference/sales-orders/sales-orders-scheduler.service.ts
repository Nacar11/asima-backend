import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, IsNull } from 'typeorm';
import { SalesOrderEntity } from './persistence/entities/sales-order.entity';
import { OrderStatusEnum } from './domain/order-status.enum';
import { PaymentStatusEnum } from './domain/payment-status.enum';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { WalletsService } from '@/wallets/wallets.service';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';

/**
 * Scheduler service for automated sales order tasks
 */
@Injectable()
export class SalesOrdersSchedulerService {
  private readonly logger = new Logger(SalesOrdersSchedulerService.name);

  // Auto-complete orders after 7 days of delivery
  private readonly AUTO_COMPLETE_DAYS = 7;

  // Cancel unpaid non-COD orders after this many hours
  private readonly PAYMENT_EXPIRY_HOURS = 24;

  constructor(
    @InjectRepository(SalesOrderEntity)
    private readonly orderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(CheckoutPaymentEntity)
    private readonly checkoutPaymentRepository: Repository<CheckoutPaymentEntity>,
    @InjectRepository(CheckoutPaymentOrderEntity)
    private readonly checkoutPaymentOrderRepository: Repository<CheckoutPaymentOrderEntity>,
    private readonly orderTrackingService: OrderTrackingService,
    private readonly inventoryStocksService: InventoryStocksService,
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Auto-complete delivered orders after 7 days
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoCompleteDeliveredOrders(): Promise<void> {
    this.logger.log('Starting auto-complete job for delivered orders...');

    try {
      // Calculate the cutoff date (7 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.AUTO_COMPLETE_DAYS);

      // Find all delivered orders where delivered_at is older than 7 days
      // Exclude pickup orders — they use a different completion flow
      const ordersToComplete = await this.orderRepository.find({
        where: {
          status: OrderStatusEnum.DELIVERED,
          delivered_at: LessThan(cutoffDate),
          fulfillment_type: 'delivery',
        },
      });

      if (ordersToComplete.length === 0) {
        this.logger.log('No orders to auto-complete.');
        return;
      }

      this.logger.log(
        `Found ${ordersToComplete.length} orders to auto-complete.`,
      );

      // Update each order to completed status.
      // The WHERE status = DELIVERED guard ensures we skip any order that was
      // transitioned (e.g. to RETURN_REQUESTED) between the find and this update.
      const now = new Date();
      let completedCount = 0;
      for (const order of ordersToComplete) {
        const result = await this.orderRepository.update(
          { id: order.id, status: OrderStatusEnum.DELIVERED },
          { status: OrderStatusEnum.COMPLETED, completed_at: now },
        );

        if (!result.affected) {
          this.logger.warn(
            `Skipped auto-complete for order #${order.order_number} — status changed before update`,
          );
          continue;
        }

        // Create tracking event for auto-completion
        await this.orderTrackingService.createEvent(
          order.id,
          OrderEventTypeEnum.COMPLETED,
          'Order auto-completed after delivery confirmation period',
        );

        // Credit seller wallet — move pending earnings to available
        if (order.seller_id) {
          try {
            await this.walletsService.confirmEarning(order.seller_id, order.id);
          } catch (e) {
            this.logger.warn(
              `Failed to confirm earning for seller ${order.seller_id}, order ${order.id}: ${(e as Error).message}`,
            );
          }
        }

        this.logger.log(
          `Auto-completed order #${order.order_number} (ID: ${order.id})`,
        );
        completedCount++;
      }

      this.logger.log(
        `Auto-complete job finished. ${completedCount}/${ordersToComplete.length} orders completed.`,
      );
    } catch (error) {
      this.logger.error('Error in auto-complete job:', error);
    }
  }

  /**
   * Cancel non-COD orders that haven't been paid within the expiry window.
   * Runs every hour to catch expired payments promptly.
   *
   * Targets orders where:
   * - payment_status is 'awaiting_payment' or 'failed'
   * - order status is still 'pending' (hasn't been confirmed/shipped)
   * - created_at is older than PAYMENT_EXPIRY_HOURS
   *
   * On expiry: cancels the order, releases reserved stock, logs tracking event.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredUnpaidOrders(): Promise<void> {
    this.logger.log('Starting payment expiry check...');

    try {
      const now = new Date();
      // Fallback cutoff for orders with no linked payment (e.g. COD edge cases)
      const fallbackCutoff = new Date();
      fallbackCutoff.setHours(
        fallbackCutoff.getHours() - this.PAYMENT_EXPIRY_HOURS,
      );

      // Find orders whose linked payment has expired (expires_at < now).
      // For orders with no payment record, fall back to created_at cutoff.
      const expiredOrders = await this.orderRepository
        .createQueryBuilder('o')
        .leftJoin(
          'checkout_payment_orders',
          'cpo',
          'cpo.sales_order_id = o.id',
        )
        .leftJoin(
          'checkout_payments',
          'cp',
          'cp.id = cpo.checkout_payment_id',
        )
        .leftJoinAndSelect('o.items', 'items')
        .where('o.status = :status', { status: OrderStatusEnum.PENDING })
        .andWhere('o.payment_status IN (:...paymentStatuses)', {
          paymentStatuses: [
            PaymentStatusEnum.AWAITING_PAYMENT,
            PaymentStatusEnum.FAILED,
          ],
        })
        .andWhere(
          '(cp.expires_at IS NOT NULL AND cp.expires_at < :now) OR (cp.expires_at IS NULL AND o.created_at < :fallback)',
          { now, fallback: fallbackCutoff },
        )
        .getMany();

      if (expiredOrders.length === 0) {
        this.logger.log('No expired unpaid orders found.');
        return;
      }

      this.logger.log(
        `Found ${expiredOrders.length} expired unpaid order(s) to cancel.`,
      );

      // Cancel atomically: WHERE status = PENDING AND payment_status IN (...)
      // prevents cancelling an order that was just confirmed by a payment webhook.
      let cancelledCount = 0;
      for (const order of expiredOrders) {
        const result = await this.orderRepository.update(
          {
            id: order.id,
            status: OrderStatusEnum.PENDING,
            payment_status: In([
              PaymentStatusEnum.AWAITING_PAYMENT,
              PaymentStatusEnum.FAILED,
            ]),
          },
          {
            status: OrderStatusEnum.CANCELLED,
            payment_status: PaymentStatusEnum.EXPIRED,
            cancelled_at: now,
          },
        );

        if (!result.affected) {
          this.logger.warn(
            `Skipped expiry cancellation for order #${order.order_number} — payment status changed before update`,
          );
          continue;
        }

        // Release reserved inventory — each item is independent; a failure on
        // one item must not abort the loop or leave other items unreleased.
        for (const item of order.items ?? []) {
          if (
            item.item_type === CartItemTypeEnum.PRODUCT &&
            item.variant_id != null
          ) {
            try {
              // System-initiated cancel: no human causer. updated_by is nullable
              // in inventory_stocks, so null is safe per the entity definition.
              await this.inventoryStocksService.releaseStock(
                item.variant_id,
                item.quantity,
                null as any,
              );
            } catch (stockError) {
              this.logger.error(
                `Failed to release stock for variant ${item.variant_id} on order #${order.order_number}`,
                stockError,
              );
            }
          }
        }

        // Log cancellation event
        await this.orderTrackingService.createEvent(
          order.id,
          OrderEventTypeEnum.CANCELLED,
          `Order auto-cancelled: payment not received within ${this.PAYMENT_EXPIRY_HOURS} hours`,
        );

        this.logger.log(
          `Cancelled expired order #${order.order_number} (ID: ${order.id})`,
        );
        cancelledCount++;
      }

      this.logger.log(
        `Payment expiry job finished. ${cancelledCount}/${expiredOrders.length} order(s) cancelled.`,
      );
    } catch (error) {
      this.logger.error('Error in payment expiry job:', error);
    }
  }

  /**
   * Release reserved stock for abandoned Maya checkout sessions.
   *
   * In the session flow, stock is reserved when the customer initiates payment
   * but no order is created yet. If the customer never completes payment (abandons
   * the Maya checkout page), the payment stays AWAITING_PAYMENT indefinitely with
   * no linked order. This job finds those stale sessions and releases the reserved stock.
   *
   * Runs every hour, matching the payment expiry window (24h).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async releaseStockForExpiredPaymentSessions(): Promise<void> {
    this.logger.log(
      'Starting stock release job for expired payment sessions...',
    );

    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - this.PAYMENT_EXPIRY_HOURS);

      // Find AWAITING_PAYMENT sessions older than 24h with no linked order (session flow)
      const expiredPayments = await this.checkoutPaymentRepository.find({
        where: {
          status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
          sales_order_id: IsNull(),
          initiated_at: LessThan(cutoff),
        },
      });

      if (expiredPayments.length === 0) {
        this.logger.log('No expired payment sessions found.');
        return;
      }

      this.logger.log(
        `Found ${expiredPayments.length} expired payment session(s) to process.`,
      );

      let releasedCount = 0;
      for (const payment of expiredPayments) {
        // Double-check: skip if any linked orders exist (safety guard)
        const linkedOrderCount =
          await this.checkoutPaymentOrderRepository.count({
            where: { checkout_payment_id: payment.id },
          });
        if (linkedOrderCount > 0) {
          continue;
        }

        // Mark payment as expired
        const result = await this.checkoutPaymentRepository.update(
          {
            id: payment.id,
            status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
          },
          { status: CheckoutPaymentStatusEnum.EXPIRED },
        );

        if (!result.affected) {
          // Status changed concurrently (webhook arrived) — skip stock release
          this.logger.warn(
            `Skipped expiry for payment ${payment.id} — status changed before update`,
          );
          continue;
        }

        // Release reserved stock from payment metadata cart_items
        const cartItems: { variant_id: number | null; quantity: number }[] =
          Array.isArray(payment.metadata?.cart_items)
            ? payment.metadata.cart_items
            : [];

        for (const item of cartItems) {
          // Only release stock for product items (services have no stock reservation)
          if (
            item.variant_id &&
            item['item_type'] !== CartItemTypeEnum.SERVICE
          ) {
            try {
              await this.inventoryStocksService.releaseStock(
                item.variant_id,
                item.quantity,
                null as any,
              );
            } catch (err) {
              this.logger.error(
                `Failed to release stock for variant ${item.variant_id} on payment ${payment.id}: ${(err as Error).message}`,
              );
            }
          }
        }

        releasedCount++;
        this.logger.log(
          `Released stock for expired payment session ${payment.id}`,
        );
      }

      this.logger.log(
        `Payment session expiry job finished. ${releasedCount}/${expiredPayments.length} session(s) processed.`,
      );
    } catch (error) {
      this.logger.error('Error in payment session expiry job:', error);
    }
  }
}
