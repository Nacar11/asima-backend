import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from './push-notification.service';
import { NotificationsService } from '../notifications.service';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { OrderNotificationDetails } from '../dto/create-notification.dto';
import { StorageService } from '@/storage/storage.service';

/**
 * Order Notification Service.
 *
 * Handles notifications for all order-related API endpoints.
 * Sends in-app, push, and email notifications immediately after successful API operations.
 *
 * @version 2
 * @since 1.0.0
 */
@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private readonly pushNotificationService: PushNotificationService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  /**
   * Build OrderNotificationDetails from SalesOrder entity.
   * Creates structured order data for rich email notifications.
   * Transforms image file paths to signed URLs for email display.
   */
  private async buildOrderDetails(
    order: SalesOrder,
  ): Promise<OrderNotificationDetails> {
    const orderItems = await Promise.all(
      (order.items || []).map(async (item) => {
        // Get the image path from variant or product
        const imagePath =
          item.variant?.variant_image_url ||
          item.variant?.product?.product_image_url ||
          undefined;

        // Transform file path to signed URL
        const imageUrl = await this.getImageUrlFromPath(imagePath);

        return {
          product_name: item.variant?.product?.product_name || 'Product',
          variant_name: item.variant?.variant_name,
          image_url: imageUrl,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
        };
      }),
    );

    const shippingAddress = order.shipping_recipient_name
      ? [
          order.shipping_recipient_name,
          order.shipping_phone,
          order.shipping_address_line1,
          order.shipping_address_line2,
          `${order.shipping_city}, ${order.shipping_state_province} ${order.shipping_postal_code}`,
          order.shipping_country,
        ]
          .filter(Boolean)
          .join(', ')
      : order.shipping_address || undefined;

    return {
      orderItems,
      subtotal: Number(order.subtotal),
      shippingAmount: Number(order.shipping_amount),
      taxAmount: Number(order.tax_amount),
      discountAmount: undefined, // Not yet supported in SalesOrder domain
      totalAmount: Number(order.total_amount),
      shippingAddress,
      sellerName: order.seller?.store_name,
    };
  }

  /**
   * Convert a file path to a signed URL for email display.
   */
  private async getImageUrlFromPath(
    filePath: string | null | undefined,
  ): Promise<string | undefined> {
    if (!filePath) return undefined;

    try {
      const urlResult = await this.storageService.get(filePath);
      if (typeof urlResult === 'object' && 'url' in urlResult) {
        return urlResult.url;
      }
      return undefined;
    } catch (error) {
      this.logger.warn(
        `Failed to generate image URL for ${filePath}: ${error}`,
      );
      return undefined;
    }
  }

  /**
   * Send notification for order placed (Customer → Seller)
   */
  async sendOrderPlacedNotification(order: SalesOrder): Promise<void> {
    try {
      // Get seller user ID from seller relation
      const sellerId = order.seller?.id;
      if (!sellerId) {
        this.logger.warn(
          `Seller relation not loaded for order ${order.id}, cannot send notification`,
        );
        return;
      }

      // Get seller details for email
      const seller = await this.sellerRepository.findOne({
        where: { id: sellerId },
        relations: ['user'],
      });

      const customerName = order.user
        ? `${order.user.first_name} ${order.user.last_name}`
        : 'Customer';

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendNewOrderToSeller(
        sellerId,
        order.id,
        order.order_number,
        customerName,
        Number(order.total_amount),
        true, // sendEmail
        seller?.user?.email ?? undefined,
        seller?.store_name ?? 'Seller',
        orderDetails,
      );

      this.logger.log(
        `Order placed notification sent to seller ${sellerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order placed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order confirmed (Seller → Customer)
   */
  async sendOrderConfirmedNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;
      const storeName = order.seller?.store_name || 'Store';

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderConfirmed(
        customerId,
        order.id,
        order.order_number,
        storeName,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order confirmed notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order processing (Seller → Customer)
   */
  async sendOrderProcessingNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;
      const storeName = order.seller?.store_name || 'Store';

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderProcessing(
        customerId,
        order.id,
        order.order_number,
        storeName,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order processing notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order processing notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order ready to ship (Seller → Customer)
   */
  async sendOrderReadyToShipNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;
      const storeName = order.seller?.store_name || 'Store';

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderReadyToShip(
        customerId,
        order.id,
        order.order_number,
        storeName,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order ready to ship notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order ready to ship notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order shipped (Seller → Customer)
   */
  async sendOrderShippedNotification(
    order: SalesOrder,
    trackingNumber?: string,
    shippingProvider?: string,
  ): Promise<void> {
    try {
      const customerId = order.user_id;

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderShipped(
        customerId,
        order.id,
        order.order_number,
        trackingNumber || order.tracking_number || undefined,
        shippingProvider || order.shipping_provider || undefined,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order shipped notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order shipped notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order out for delivery (Seller → Customer)
   */
  async sendOrderOutForDeliveryNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderOutForDelivery(
        customerId,
        order.id,
        order.order_number,
        order.tracking_number || undefined,
        order.shipping_provider || undefined,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order out for delivery notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order out for delivery notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order delivered (Seller → Customer)
   */
  async sendOrderDeliveredNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      const orderDetails = await this.buildOrderDetails(order);

      await this.notificationsService.sendOrderDelivered(
        customerId,
        order.id,
        order.order_number,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        orderDetails,
      );

      this.logger.log(
        `Order delivered notification sent to customer ${customerId} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order delivered notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order completed (To both Customer and Seller)
   */
  async sendOrderCompletedNotification(order: SalesOrder): Promise<void> {
    try {
      const customerId = order.user_id;
      const sellerId = order.seller?.id;

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      // Notify customer that order is completed
      await this.notificationsService.sendOrderCompleted(
        customerId,
        order.id,
        order.order_number,
        true, // sendEmail
        customer?.email ?? undefined,
        customer ? `${customer.first_name} ${customer.last_name}` : undefined,
      );

      this.logger.log(
        `Order completed notification sent to customer ${customerId} for order ${order.id}`,
      );

      // Notify seller that order is completed
      if (sellerId) {
        const seller = await this.sellerRepository.findOne({
          where: { id: sellerId },
          relations: ['user'],
        });

        const customerName = order.user
          ? `${order.user.first_name} ${order.user.last_name}`
          : 'Customer';

        const orderDetails = await this.buildOrderDetails(order);

        await this.notificationsService.sendOrderCompletedToSeller(
          sellerId,
          order.id,
          order.order_number,
          customerName,
          Number(order.total_amount),
          true, // sendEmail
          seller?.user?.email ?? undefined,
          seller?.store_name ?? 'Seller',
          orderDetails,
        );

        this.logger.log(
          `Order completed notification sent to seller ${sellerId} for order ${order.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send order completed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for order cancelled (To both Customer and Seller)
   */
  async sendOrderCancelledNotification(
    order: SalesOrder,
    cancelledBy: 'customer' | 'seller',
    reason?: string,
  ): Promise<void> {
    try {
      const customerId = order.user_id;
      const sellerId = order.seller?.id;

      // Get customer details for email
      const customer = await this.userRepository.findOne({
        where: { id: customerId },
      });

      // Get seller details for email
      const seller = sellerId
        ? await this.sellerRepository.findOne({
            where: { id: sellerId },
            relations: ['user'],
          })
        : null;

      const customerName = order.user
        ? `${order.user.first_name} ${order.user.last_name}`
        : 'Customer';

      const orderDetails = await this.buildOrderDetails(order);

      if (cancelledBy === 'customer') {
        // 1. Notify SELLER
        if (sellerId && seller) {
          await this.notificationsService.sendOrderCancelledToSeller(
            sellerId,
            order.id,
            order.order_number,
            customerName,
            reason,
            true, // sendEmail
            seller.user?.email ?? undefined,
            seller.store_name ?? 'Seller',
            orderDetails,
          );
          this.logger.log(
            `Order cancelled notification sent to SELLER ${sellerId}`,
          );
        }

        // 2. Notify CUSTOMER (Confirmation)
        await this.notificationsService.sendOrderCancelled(
          customerId,
          order.id,
          order.order_number,
          reason,
          true, // sendEmail
          customer?.email ?? undefined,
          customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        );
        this.logger.log(
          `Order cancelled confirmation sent to CUSTOMER ${customerId}`,
        );
      } else if (cancelledBy === 'seller') {
        // 1. Notify CUSTOMER
        await this.notificationsService.sendOrderCancelled(
          customerId,
          order.id,
          order.order_number,
          reason,
          true, // sendEmail
          customer?.email ?? undefined,
          customer ? `${customer.first_name} ${customer.last_name}` : undefined,
        );
        this.logger.log(
          `Order cancelled notification sent to CUSTOMER ${customerId}`,
        );

        // 2. Notify SELLER (Confirmation)
        if (sellerId && seller) {
          await this.notificationsService.sendOrderCancelledToSeller(
            sellerId,
            order.id,
            order.order_number,
            customerName,
            reason,
            true, // sendEmail
            seller.user?.email ?? undefined,
            seller.store_name ?? 'Seller',
            orderDetails,
          );
          this.logger.log(
            `Order cancelled confirmation sent to SELLER ${sellerId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to send order cancelled notification: ${error.message}`,
      );
    }
  }
}
