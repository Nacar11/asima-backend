import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { OrderTrackingEventEntity } from '@/order-tracking/persistence/entities/order-tracking-event.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { ShippingService } from '@/shipping/services/shipping.service';
import { ISeedService } from '../seed.interface';

@Injectable()
export class SalesOrderSeedService implements ISeedService {
  constructor(
    @InjectRepository(SalesOrderEntity)
    private orderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private orderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserAddressEntity)
    private userAddressRepository: Repository<UserAddressEntity>,
    @InjectRepository(OrderTrackingEventEntity)
    private orderTrackingEventRepository: Repository<OrderTrackingEventEntity>,
    private shippingService: ShippingService,
  ) {}

  async run(): Promise<void> {
    const count = await this.orderRepository.count();

    if (!count) {
      // Get the first user (admin user)
      const user = await this.userRepository.findOne({
        where: { id: 1 },
      });

      if (!user) {
        console.error('❌ No user found. Cannot proceed to seed sales orders.');
        return;
      }

      // Get user's default address for shipping calculation
      const userAddress = await this.userAddressRepository.findOne({
        where: { user_id: user.id, is_default: true },
      });

      if (!userAddress) {
        console.error(
          '❌ No default address found for user. Cannot proceed to seed sales orders.',
        );
        return;
      }

      // Get a seller
      const seller = await this.sellerRepository.findOne({
        where: { id: 1 },
      });

      if (!seller || !seller.pickup_latitude || !seller.pickup_longitude) {
        console.error(
          '❌ Seller not found or missing pickup coordinates. Cannot proceed to seed sales orders.',
        );
        return;
      }

      // Get product variants with their prices
      const productVariants = await this.productVariantRepository.find({
        take: 12,
        where: { status: 'Active' },
      });

      if (productVariants.length < 6) {
        console.error(
          '❌ Not enough product variants found. Cannot proceed to seed sales orders.',
        );
        return;
      }

      // All possible statuses
      const statuses = Object.values(OrderStatusEnum);

      // Add extra DELIVERED and COMPLETED orders for testing returns
      // These will NOT have return requests created by the return-request seeder
      const extraTestOrders = [
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.COMPLETED,
        OrderStatusEnum.COMPLETED,
        OrderStatusEnum.COMPLETED,
        OrderStatusEnum.COMPLETED,
        OrderStatusEnum.COMPLETED,
      ];
      const allOrderStatuses = [...statuses, ...extraTestOrders];

      // Create one order for each status (plus extra test orders)
      for (let i = 0; i < allOrderStatuses.length; i++) {
        const status = allOrderStatuses[i];
        const orderNumber = this.generateOrderNumber(i);

        // Calculate order totals
        const itemsForOrder = productVariants.slice(i * 2, i * 2 + 2);
        if (itemsForOrder.length === 0) {
          // Reuse variants if we run out
          itemsForOrder.push(productVariants[i % productVariants.length]);
        }

        let subtotal = 0;
        const orderItems: Partial<SalesOrderItemEntity>[] = [];
        const shippingItems: Array<{
          quantity: number;
          weight_kg: number;
          length_cm?: number;
          width_cm?: number;
          height_cm?: number;
        }> = [];

        for (const variant of itemsForOrder) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = Number(variant.selling_price) || 100;
          const totalPrice = unitPrice * quantity;
          subtotal += totalPrice;

          orderItems.push({
            variant_id: variant.id,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            created_by: user,
            updated_by: user,
          });

          // Build shipping items for calculation
          shippingItems.push({
            quantity,
            weight_kg: Number(variant.weight_kg) || 0.5,
            length_cm: variant.length_cm
              ? Number(variant.length_cm)
              : undefined,
            width_cm: variant.width_cm ? Number(variant.width_cm) : undefined,
            height_cm: variant.height_cm
              ? Number(variant.height_cm)
              : undefined,
          });
        }

        // Calculate shipping using ShippingService
        let shippingAmount = 0;
        try {
          const shippingResult = await this.shippingService.calculateShipping({
            items: shippingItems,
            seller_location: {
              latitude: Number(seller.pickup_latitude),
              longitude: Number(seller.pickup_longitude),
            },
            buyer_location: {
              latitude: Number(userAddress.latitude),
              longitude: Number(userAddress.longitude),
            },
            subtotal,
            buyer_address: {
              country: userAddress.country || undefined,
              province: userAddress.state_province || undefined,
              city: userAddress.city || undefined,
              postal_code: userAddress.postal_code || undefined,
            },
          });
          shippingAmount = shippingResult.shipping_amount;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          if (
            !errorMessage.includes(
              'No default shipping provider configured. Please contact administrator.',
            )
          ) {
            console.warn(
              `⚠️  Could not calculate shipping for order ${orderNumber}: ${errorMessage}`,
            );
          }
          shippingAmount = 50; // Default fallback
        }

        const totalAmount = subtotal + shippingAmount;

        // Create the order
        const order = await this.orderRepository.save({
          user_id: user.id,
          seller_id: seller?.id || null,
          user_address_id: userAddress.id,
          order_number: orderNumber,
          status: status,
          subtotal: subtotal,
          tax_amount: 0,
          shipping_amount: shippingAmount,
          total_amount: totalAmount,
          notes: 'Please handle with care',
          status_notes: `Sample order with status: ${status}`,
          shipping_address: `${userAddress.address_line1}, ${userAddress.city}, ${userAddress.state_province} ${userAddress.postal_code}, ${userAddress.country}`,
          shipping_recipient_name: `${user.first_name} ${user.last_name}`,
          shipping_phone: userAddress.phone || '+1234567890',
          shipping_address_line1: userAddress.address_line1,
          shipping_address_line2: userAddress.address_line2 || null,
          shipping_city: userAddress.city,
          shipping_state_province: userAddress.state_province,
          shipping_postal_code: userAddress.postal_code,
          shipping_country: userAddress.country,
          // Set shipping provider and tracking number for shipped orders
          // Uses "In-House Delivery" which matches the seeded shipping provider
          shipping_provider: [
            OrderStatusEnum.SHIPPED,
            OrderStatusEnum.OUT_FOR_DELIVERY,
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.COMPLETED,
            OrderStatusEnum.RETURNED,
            OrderStatusEnum.REFUNDED,
          ].includes(status)
            ? 'In-House Delivery'
            : null,
          tracking_number: [
            OrderStatusEnum.SHIPPED,
            OrderStatusEnum.OUT_FOR_DELIVERY,
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.COMPLETED,
            OrderStatusEnum.RETURNED,
            OrderStatusEnum.REFUNDED,
          ].includes(status)
            ? `IHD${Date.now().toString().slice(-10)}${i}`
            : null,
          // Set timestamps based on status
          shipped_at: [
            OrderStatusEnum.SHIPPED,
            OrderStatusEnum.OUT_FOR_DELIVERY,
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.COMPLETED,
            OrderStatusEnum.RETURNED,
            OrderStatusEnum.REFUNDED,
          ].includes(status)
            ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            : null,
          delivered_at: [
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.COMPLETED,
            OrderStatusEnum.RETURNED,
            OrderStatusEnum.REFUNDED,
          ].includes(status)
            ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            : null,
          completed_at:
            status === OrderStatusEnum.COMPLETED
              ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
              : null,
          cancelled_at:
            status === OrderStatusEnum.CANCELLED ? new Date() : null,
          cancellation_reason:
            status === OrderStatusEnum.CANCELLED
              ? 'Customer requested cancellation'
              : null,
          created_by: user,
          updated_by: user,
        });

        // Create order items
        for (const item of orderItems) {
          await this.orderItemRepository.save({
            ...item,
            order_id: order.id,
          });
        }

        // Create order tracking events based on status
        await this.createTrackingEventsForOrder(order.id, status, user);
      }

      console.log(`✅ Sales orders seeded successfully:`);
      console.log(
        `   - ${allOrderStatuses.length} orders created (one for each status + ${extraTestOrders.length} extra for return testing)`,
      );
      console.log(`   - Order tracking events created for each order`);
      console.log(
        `   - Extra DELIVERED/COMPLETED orders available for return request testing`,
      );
    } else {
      console.log('⚠️  Sales orders already exist, skipping seed');
    }
  }

  /**
   * Create order tracking events based on order status
   * Each status gets all the events that would have occurred to reach that status
   */
  private async createTrackingEventsForOrder(
    orderId: number,
    status: OrderStatusEnum,
    user: UserEntity,
  ): Promise<void> {
    const eventsToCreate = this.getTrackingEventsForStatus(status);
    const baseTime = new Date();

    // Create events with progressive timestamps (each event 2-4 hours apart)
    for (let i = 0; i < eventsToCreate.length; i++) {
      const event = eventsToCreate[i];
      const hoursAgo = (eventsToCreate.length - i) * 3; // 3 hours between each event
      const eventTimestamp = new Date(
        baseTime.getTime() - hoursAgo * 60 * 60 * 1000,
      );

      await this.orderTrackingEventRepository.save({
        order_id: orderId,
        event_type: event.type,
        description: event.description,
        location: event.location || null,
        latitude: event.latitude || null,
        longitude: event.longitude || null,
        event_timestamp: eventTimestamp,
        created_by: user,
        // created_at is auto-generated by @CreateDateColumn()
      });
    }
  }

  /**
   * Get the sequence of tracking events for a given order status
   */
  private getTrackingEventsForStatus(status: OrderStatusEnum): Array<{
    type: OrderEventTypeEnum;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  }> {
    const events: Array<{
      type: OrderEventTypeEnum;
      description: string;
      location?: string;
      latitude?: number;
      longitude?: number;
    }> = [];

    // Base event - ORDER_PLACED (all orders have this)
    events.push({
      type: OrderEventTypeEnum.ORDER_PLACED,
      description: 'Order has been placed successfully',
    });

    if (status === OrderStatusEnum.PENDING) {
      return events;
    }

    // CONFIRMED and beyond
    events.push({
      type: OrderEventTypeEnum.PAYMENT_CONFIRMED,
      description: 'Payment has been confirmed',
    });
    events.push({
      type: OrderEventTypeEnum.ORDER_CONFIRMED,
      description: 'Order has been confirmed by seller',
    });

    if (status === OrderStatusEnum.CONFIRMED) {
      return events;
    }

    // CANCELLED - can happen at any stage, we'll say after confirmation
    if (status === OrderStatusEnum.CANCELLED) {
      events.push({
        type: OrderEventTypeEnum.CANCELLED,
        description: 'Order has been cancelled by customer',
      });
      return events;
    }

    // PROCESSING and beyond
    events.push({
      type: OrderEventTypeEnum.PROCESSING,
      description: 'Order is being prepared for shipment',
      location: 'Seller Warehouse',
    });

    if (status === OrderStatusEnum.PROCESSING) {
      return events;
    }

    // READY_TO_SHIP and beyond
    events.push({
      type: OrderEventTypeEnum.READY_TO_SHIP,
      description: 'Order is packed and ready for pickup by courier',
      location: 'Seller Warehouse',
    });

    if (status === OrderStatusEnum.READY_TO_SHIP) {
      return events;
    }

    // SHIPPED and beyond
    events.push({
      type: OrderEventTypeEnum.SHIPPED,
      description: 'Order has been shipped via courier',
      location: 'Sorting Facility',
      latitude: 14.5995,
      longitude: 120.9842,
    });

    if (status === OrderStatusEnum.SHIPPED) {
      return events;
    }

    // OUT_FOR_DELIVERY and beyond
    events.push({
      type: OrderEventTypeEnum.OUT_FOR_DELIVERY,
      description: 'Order is out for delivery',
      location: 'Local Delivery Hub',
      latitude: 14.6042,
      longitude: 120.9822,
    });

    if (status === OrderStatusEnum.OUT_FOR_DELIVERY) {
      return events;
    }

    // DELIVERED and beyond
    events.push({
      type: OrderEventTypeEnum.DELIVERED,
      description: 'Order has been delivered successfully',
      location: 'Customer Address',
      latitude: 14.6091,
      longitude: 120.9897,
    });

    if (status === OrderStatusEnum.DELIVERED) {
      return events;
    }

    // COMPLETED
    if (status === OrderStatusEnum.COMPLETED) {
      events.push({
        type: OrderEventTypeEnum.COMPLETED,
        description: 'Order has been completed',
      });
      return events;
    }

    // RETURNED - full delivery flow then returned
    if (status === OrderStatusEnum.RETURNED) {
      events.push({
        type: OrderEventTypeEnum.RETURNED,
        description: 'Order has been returned by customer',
      });
      return events;
    }

    // REFUNDED - full return flow then refunded
    if (status === OrderStatusEnum.REFUNDED) {
      events.push({
        type: OrderEventTypeEnum.RETURNED,
        description: 'Order has been returned by customer',
      });
      events.push({
        type: OrderEventTypeEnum.REFUND_PROCESSED,
        description: 'Refund has been processed successfully',
      });
      return events;
    }

    return events;
  }

  /**
   * Generate a unique order number for seeding
   */
  private generateOrderNumber(index: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = index.toString(36).toUpperCase().padStart(2, '0');
    return `ORD-SEED-${timestamp}-${suffix}`;
  }
}
