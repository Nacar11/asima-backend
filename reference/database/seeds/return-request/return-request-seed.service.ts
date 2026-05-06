import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from '@/return-requests/persistence/entities/return-request-item.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { OrderTrackingEventEntity } from '@/order-tracking/persistence/entities/order-tracking-event.entity';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';
import { ReturnRequestItemStatusEnum } from '@/return-requests/domain/return-request-item-status.enum';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { ISeedService } from '../seed.interface';

@Injectable()
export class ReturnRequestSeedService implements ISeedService {
  constructor(
    @InjectRepository(ReturnRequestEntity)
    private returnRequestRepository: Repository<ReturnRequestEntity>,
    @InjectRepository(ReturnRequestItemEntity)
    private returnRequestItemRepository: Repository<ReturnRequestItemEntity>,
    @InjectRepository(SalesOrderEntity)
    private orderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private orderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(OrderTrackingEventEntity)
    private orderTrackingEventRepository: Repository<OrderTrackingEventEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.returnRequestRepository.count();

    if (!count) {
      // Get admin user
      const user = await this.userRepository.findOne({
        where: { id: 1 },
      });

      if (!user) {
        console.error(
          '❌ No user found. Cannot proceed to seed return requests.',
        );
        return;
      }

      // Get orders that can have returns (DELIVERED, COMPLETED, RETURNED, REFUNDED)
      const eligibleStatuses = [
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.COMPLETED,
        OrderStatusEnum.RETURNED,
        OrderStatusEnum.REFUNDED,
      ];

      const eligibleOrders = await this.orderRepository.find({
        where: eligibleStatuses.map((status) => ({ status })),
        relations: ['items'],
        take: 8,
      });

      // Filter orders to only include those with product items (return requests are for products only)
      const ordersWithProductItems = eligibleOrders.filter((order) =>
        order.items?.some(
          (item) =>
            item.item_type === CartItemTypeEnum.PRODUCT &&
            item.variant_id !== null &&
            item.variant_id !== undefined,
        ),
      );

      if (ordersWithProductItems.length === 0) {
        console.error(
          '❌ No eligible orders with product items found (DELIVERED/COMPLETED status). Cannot proceed to seed return requests.',
        );
        return;
      }

      // Define sample return requests with different statuses
      // Two PENDING requests are created so you can test both approve and reject flows
      const returnRequestScenarios: Array<{
        status: ReturnRequestStatusEnum;
        reason: string;
        itemStatus: ReturnRequestItemStatusEnum;
      }> = [
        {
          status: ReturnRequestStatusEnum.PENDING,
          reason:
            'Item arrived damaged. The packaging was torn and the product has visible scratches.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.PENDING,
          reason:
            'Product stopped working after 2 days of use. Appears to be a manufacturing defect.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.APPROVED,
          reason: 'Wrong item received. Ordered blue variant but received red.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.REJECTED,
          reason: 'Changed my mind about the purchase.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.PICKUP_SCHEDULED,
          reason: 'Product is defective - buttons not working properly.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.PICKED_UP,
          reason: 'Missing parts in the package.',
          itemStatus: ReturnRequestItemStatusEnum.PENDING,
        },
        {
          status: ReturnRequestStatusEnum.RECEIVED,
          reason: 'Product quality does not match description.',
          itemStatus: ReturnRequestItemStatusEnum.RECEIVED,
        },
        {
          status: ReturnRequestStatusEnum.REFUNDED,
          reason: 'Item not as described. Significantly smaller than expected.',
          itemStatus: ReturnRequestItemStatusEnum.REFUNDED,
        },
      ];

      let createdCount = 0;

      for (
        let i = 0;
        i <
        Math.min(ordersWithProductItems.length, returnRequestScenarios.length);
        i++
      ) {
        const order = ordersWithProductItems[i];
        const scenario = returnRequestScenarios[i];

        // Skip if order has no items
        if (!order.items || order.items.length === 0) {
          continue;
        }

        // Find first product item (skip service items as return requests are for products only)
        const orderItem = order.items.find(
          (item) =>
            item.item_type === CartItemTypeEnum.PRODUCT &&
            item.variant_id !== null &&
            item.variant_id !== undefined,
        );

        // Skip if no product items found
        if (!orderItem || !orderItem.variant_id) {
          continue;
        }
        const quantityReturning = Math.min(orderItem.quantity, 1); // Return 1 item
        const returnAmount = Number(orderItem.unit_price) * quantityReturning;

        // Create return request
        const returnRequest = await this.returnRequestRepository.save({
          return_number: this.generateReturnNumber(),
          order_id: order.id,
          user_id: order.user_id,
          seller_id: order.seller_id,
          status: scenario.status,
          reason: scenario.reason,
          previous_order_status: order.status,
          calculated_refund_amount: returnAmount,
          actual_refund_amount:
            scenario.status === ReturnRequestStatusEnum.REFUNDED
              ? returnAmount
              : null,
          requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          // Set approval info for approved+ statuses
          approved_at: this.isStatusAfterApproval(scenario.status)
            ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            : null,
          approved_by: this.isStatusAfterApproval(scenario.status)
            ? user.id
            : null,
          approval_notes: this.isStatusAfterApproval(scenario.status)
            ? 'Return request approved based on provided evidence.'
            : null,
          // Set rejection info for rejected status
          rejected_at:
            scenario.status === ReturnRequestStatusEnum.REJECTED
              ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
              : null,
          rejected_by:
            scenario.status === ReturnRequestStatusEnum.REJECTED
              ? user.id
              : null,
          rejection_reason:
            scenario.status === ReturnRequestStatusEnum.REJECTED
              ? 'Return request does not meet our return policy criteria. Only defective or damaged items are eligible for return.'
              : null,
          // Set pickup info for pickup_scheduled+ statuses
          pickup_scheduled_at: this.isStatusAfterPickupScheduled(
            scenario.status,
          )
            ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            : null,
          pickup_scheduled_date: this.isStatusAfterPickupScheduled(
            scenario.status,
          )
            ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            : null,
          pickup_scheduled_by: this.isStatusAfterPickupScheduled(
            scenario.status,
          )
            ? user.id
            : null,
          pickup_notes: this.isStatusAfterPickupScheduled(scenario.status)
            ? 'Courier will pick up between 9 AM - 12 PM.'
            : null,
          // Set picked up info for picked_up+ statuses
          picked_up_at: this.isStatusAfterPickedUp(scenario.status)
            ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            : null,
          picked_up_by: this.isStatusAfterPickedUp(scenario.status)
            ? user.id
            : null,
          // Set received info for received+ statuses
          received_at: this.isStatusAfterReceived(scenario.status)
            ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            : null,
          received_by: this.isStatusAfterReceived(scenario.status)
            ? user.id
            : null,
          // Set refund info for refunded status
          refunded_at:
            scenario.status === ReturnRequestStatusEnum.REFUNDED
              ? new Date()
              : null,
          refunded_by:
            scenario.status === ReturnRequestStatusEnum.REFUNDED
              ? user.id
              : null,
          refund_notes:
            scenario.status === ReturnRequestStatusEnum.REFUNDED
              ? 'Refund processed successfully via original payment method.'
              : null,
          created_by: user,
          updated_by: user,
        });

        // Create return request item (only for product items)
        await this.returnRequestItemRepository.save({
          return_request_id: returnRequest.id,
          sales_order_item_id: orderItem.id,
          variant_id: orderItem.variant_id!, // Non-null assertion is safe due to check above
          quantity_ordered: orderItem.quantity,
          quantity_returning: quantityReturning,
          unit_price: orderItem.unit_price,
          return_amount: returnAmount,
          item_status: scenario.itemStatus,
          created_by: user,
          updated_by: user,
        });

        // Update quantity_returned on sales order item for completed returns
        if (
          scenario.status === ReturnRequestStatusEnum.RECEIVED ||
          scenario.status === ReturnRequestStatusEnum.REFUNDED
        ) {
          await this.orderItemRepository.update(orderItem.id, {
            quantity_returned: quantityReturning,
          });
        }

        // Update sales order status to REFUNDED for refunded returns (both full and partial)
        if (scenario.status === ReturnRequestStatusEnum.REFUNDED) {
          await this.orderRepository.update(order.id, {
            status: OrderStatusEnum.REFUNDED,
          });
        }

        // Create order tracking events for returns
        await this.createReturnTrackingEvents(
          order.id,
          scenario.status,
          user,
          returnRequest.id,
        );

        createdCount++;
      }

      console.log(`✅ Return requests seeded successfully:`);
      console.log(`   - ${createdCount} return requests created`);
      console.log(
        `   - Statuses: 2x PENDING (for approve/reject testing), APPROVED, REJECTED, PICKUP_SCHEDULED, PICKED_UP, RECEIVED, REFUNDED`,
      );
    } else {
      console.log('⚠️  Return requests already exist, skipping seed');
    }
  }

  private isStatusAfterApproval(status: ReturnRequestStatusEnum): boolean {
    return [
      ReturnRequestStatusEnum.APPROVED,
      ReturnRequestStatusEnum.PICKUP_SCHEDULED,
      ReturnRequestStatusEnum.PICKED_UP,
      ReturnRequestStatusEnum.RECEIVED,
      ReturnRequestStatusEnum.REFUNDED,
    ].includes(status);
  }

  private isStatusAfterPickupScheduled(
    status: ReturnRequestStatusEnum,
  ): boolean {
    return [
      ReturnRequestStatusEnum.PICKUP_SCHEDULED,
      ReturnRequestStatusEnum.PICKED_UP,
      ReturnRequestStatusEnum.RECEIVED,
      ReturnRequestStatusEnum.REFUNDED,
    ].includes(status);
  }

  private isStatusAfterPickedUp(status: ReturnRequestStatusEnum): boolean {
    return [
      ReturnRequestStatusEnum.PICKED_UP,
      ReturnRequestStatusEnum.RECEIVED,
      ReturnRequestStatusEnum.REFUNDED,
    ].includes(status);
  }

  private isStatusAfterReceived(status: ReturnRequestStatusEnum): boolean {
    return [
      ReturnRequestStatusEnum.RECEIVED,
      ReturnRequestStatusEnum.REFUNDED,
    ].includes(status);
  }

  /**
   * Generate unique return number
   * Format: RR-{timestamp base36}-{random}
   * Example: RR-M5K8P2Q3-A7B9
   */
  private generateReturnNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RR-${timestamp}-${random}`;
  }

  /**
   * Create order tracking events for return request status changes
   */
  private async createReturnTrackingEvents(
    orderId: number,
    status: ReturnRequestStatusEnum,
    user: UserEntity,
    returnRequestId: number,
  ): Promise<void> {
    const events = this.getReturnTrackingEventsForStatus(
      status,
      returnRequestId,
    );
    const baseTime = new Date();

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const hoursAgo = (events.length - i) * 12; // 12 hours between each event
      const eventTimestamp = new Date(
        baseTime.getTime() - hoursAgo * 60 * 60 * 1000,
      );

      await this.orderTrackingEventRepository.save({
        order_id: orderId,
        event_type: event.type,
        description: event.description,
        event_timestamp: eventTimestamp,
        created_by: user,
      });
    }
  }

  /**
   * Get the sequence of tracking events for a given return status
   */
  private getReturnTrackingEventsForStatus(
    status: ReturnRequestStatusEnum,
    returnRequestId: number,
  ): Array<{
    type: OrderEventTypeEnum;
    description: string;
  }> {
    const events: Array<{
      type: OrderEventTypeEnum;
      description: string;
    }> = [];

    // RETURN_REQUESTED - all return requests have this
    events.push({
      type: OrderEventTypeEnum.RETURN_REQUESTED,
      description: `Return request #${returnRequestId} has been submitted`,
    });

    if (status === ReturnRequestStatusEnum.PENDING) {
      return events;
    }

    if (status === ReturnRequestStatusEnum.REJECTED) {
      events.push({
        type: OrderEventTypeEnum.RETURN_REJECTED,
        description: `Return request #${returnRequestId} has been rejected`,
      });
      return events;
    }

    // APPROVED and beyond
    events.push({
      type: OrderEventTypeEnum.RETURN_APPROVED,
      description: `Return request #${returnRequestId} has been approved`,
    });

    if (status === ReturnRequestStatusEnum.APPROVED) {
      return events;
    }

    // PICKUP_SCHEDULED and beyond
    events.push({
      type: OrderEventTypeEnum.RETURN_PICKUP_SCHEDULED,
      description: `Pickup scheduled for return request #${returnRequestId}`,
    });

    if (status === ReturnRequestStatusEnum.PICKUP_SCHEDULED) {
      return events;
    }

    // PICKED_UP and beyond
    events.push({
      type: OrderEventTypeEnum.RETURN_PICKED_UP,
      description: `Items picked up for return request #${returnRequestId}`,
    });

    if (status === ReturnRequestStatusEnum.PICKED_UP) {
      return events;
    }

    // RECEIVED and beyond
    events.push({
      type: OrderEventTypeEnum.RETURN_RECEIVED,
      description: `Items received for return request #${returnRequestId}`,
    });

    if (status === ReturnRequestStatusEnum.RECEIVED) {
      return events;
    }

    // REFUNDED
    if (status === ReturnRequestStatusEnum.REFUNDED) {
      events.push({
        type: OrderEventTypeEnum.REFUND_PROCESSED,
        description: `Refund processed for return request #${returnRequestId}`,
      });
      return events;
    }

    return events;
  }
}
