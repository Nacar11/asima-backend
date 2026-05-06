import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseNotificationRepository } from './persistence/base-notification.repository';
import { Notification } from './domain/notification';
import {
  CreateNotificationDto,
  OrderNotificationDetails,
  ReturnNotificationDetails,
} from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

import { NotificationTypeEnum } from './enums/notification-type.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PushNotificationService } from './services/push-notification.service';
import { MailService } from '@/mail/mail.service';
import { NotificationsGateway } from './notifications.gateway';
import { formatCurrency } from '@/utils/currency.util';

/**
 * Notifications Service.
 *
 * Handles business logic for notifications. Manages notification creation,
 * retrieval, read status, push notification sending, and real-time
 * WebSocket delivery.
 *
 * @version 2
 * @since 1.0.0
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: BaseNotificationRepository,
    private readonly pushNotificationService: PushNotificationService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a notification.
   *
   * Creates an in-app notification, sends via WebSocket if user is connected,
   * and optionally sends push notification.
   *
   * @param input - Create notification DTO
   * @returns Created notification
   */
  async create(input: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification();
    notification.user_id = input.user_id;
    notification.type = input.type;
    notification.title = input.title;
    notification.body = input.body || null;
    notification.entity_type = input.entity_type || null;
    notification.entity_id = input.entity_id || null;
    notification.action_url = input.action_url || null;
    notification.read_at = null;
    notification.push_sent = false;
    notification.push_sent_at = null;
    notification.status = input.status || 'Active';

    const created = await this.repository.create(notification);
    const savedNotification = (await this.repository.findById(
      created.id,
    )) as Notification;

    // Send via WebSocket
    try {
      await this.sendWebSocketNotification(input.user_id, savedNotification);
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
      // Don't fail if WebSocket delivery fails
    }

    // Send push notification if requested
    if (input.send_push) {
      try {
        await this.pushNotificationService.sendToUser(
          input.user_id,
          input.title,
          input.body || '',
          {
            type: input.type,
            entity_type: input.entity_type || '',
            entity_id: String(input.entity_id || ''),
            action_url: input.action_url || '',
            notification_id: String(created.id),
          },
        );

        // Update push sent status
        await this.repository.update(created.id, {
          push_sent: true,
          push_sent_at: new Date(),
        });
      } catch (error) {
        console.error('Failed to send push notification:', error);
        // Don't fail the notification creation if push fails
      }
    }

    // Send email notification if requested
    if (input.send_email && input.user_email) {
      try {
        await this.sendEmailNotification(input);
      } catch (error) {
        console.error('Failed to send email notification:', error);
        // Don't fail the notification creation if email fails
      }
    }

    return savedNotification;
  }

  /**
   * Find all notifications for the current user with pagination.
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Paginated notifications
   */
  async findByUser(
    userId: number,
    query: QueryNotificationDto,
    isAdmin?: boolean,
  ): Promise<IPaginatedResult<Notification>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const filterQuery: any = { user_id: userId };

    if (query.type) {
      filterQuery.type = query.type;
    }

    if (query.is_read !== undefined) {
      filterQuery.is_read = query.is_read;
    }

    return this.repository.findAllWithPagination({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Find a notification by ID.
   *
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Notification if found
   */
  async findById(id: number, userId: number): Promise<Notification> {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Authorization: users can only access their own notifications
    if (notification.user_id !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Mark a notification as read.
   *
   * @param id - Notification ID
   * @param userId - User ID
   */
  async markAsRead(id: number, userId: number): Promise<void> {
    await this.findById(id, userId);
    await this.repository.markAsRead(id, userId);

    // Emit WebSocket event
    await this.sendWebSocketNotificationRead(userId, id);
  }

  /**
   * Mark all notifications as read for a user.
   *
   * @param userId - User ID
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.repository.markAllAsRead(userId);

    // Emit WebSocket event
    await this.sendWebSocketAllNotificationsRead(userId);
  }

  /**
   * Get unread notification count for a user.
   *
   * @param userId - User ID
   * @returns Unread count
   */
  async getUnreadCount(userId: number, isAdmin?: boolean): Promise<number> {
    return this.repository.getUnreadCount(userId);
  }

  /**
   * Delete a notification.
   *
   * @param id - Notification ID
   * @param userId - User ID
   */
  async delete(id: number, userId: number): Promise<void> {
    await this.findById(id, userId); // Verify exists and belongs to user
    await this.repository.delete(id);
  }

  // ==================== GENERIC NOTIFY HELPER ====================

  /**
   * Send notification via WebSocket AND FCM push.
   *
   * Generic helper method for other services to send notifications.
   *
   * @param userId - Recipient user ID
   * @param type - Notification type from enum
   * @param title - Notification title
   * @param body - Notification body
   * @param entityType - Related entity type (booking, milestone, etc.)
   * @param entityId - Related entity ID
   * @param actionUrl - Deep link URL
   * @returns Created notification
   */
  async notify(
    userId: number,
    type: NotificationTypeEnum,
    title: string,
    body: string,
    entityType?: string,
    entityId?: number,
    actionUrl?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type,
      title,
      body,
      entity_type: entityType,
      entity_id: entityId,
      action_url: actionUrl,
      send_push: true,
    });
  }

  // ==================== BOOKING NOTIFICATION HELPERS ====================

  /**
   * Send notification for booking confirmed.
   *
   * Helper method to create booking confirmation notification.
   *
   * @param userId - User ID
   * @param bookingId - Booking ID
   * @param bookingNumber - Booking number
   * @param providerName - Provider name
   * @param sendEmail - Whether to send email notification
   * @param userEmail - User email for email notifications
   * @param userName - User name for email notifications
   */
  async sendBookingConfirmed(
    userId: number,
    bookingId: number,
    bookingNumber: string,
    providerName: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.BOOKING_CONFIRMED,
      title: 'Booking Confirmed',
      body: `Your booking ${bookingNumber} has been confirmed by ${providerName}.`,
      entity_type: 'booking',
      entity_id: bookingId,
      action_url: `/bookings/${bookingId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  async sendReturnPickupScheduledToSeller(
    sellerId: number,
    returnId: number,
    returnNumber: string,
    orderNumber: string,
    customerName: string,
    pickupDate: Date,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
  ): Promise<Notification> {
    const formattedDate = pickupDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.RETURN_PICKUP_SCHEDULED,
      title: 'Pickup Scheduled',
      body: `Pickup for return ${returnNumber} (order ${orderNumber}) from ${customerName} is scheduled for ${formattedDate}.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/seller/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      order_number: orderNumber,
      return_number: returnNumber,
      customer_name: customerName,
      pickup_date: formattedDate,
    });
  }

  /**
   * Send notification for milestone submitted.
   *
   * @param userId - User ID
   * @param milestoneId - Milestone ID
   * @param bookingId - Booking ID
   * @param milestoneName - Milestone name
   * @param providerName - Provider name
   * @param sendEmail - Whether to send email notification
   * @param userEmail - User email for email notifications
   * @param userName - User name for email notifications
   */
  async sendMilestoneSubmitted(
    userId: number,
    milestoneId: number,
    bookingId: number,
    milestoneName: string,
    providerName: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.MILESTONE_SUBMITTED,
      title: 'Milestone Submitted',
      body: `${providerName} has submitted milestone "${milestoneName}" for your review.`,
      entity_type: 'milestone',
      entity_id: milestoneId,
      action_url: `/bookings/${bookingId}/milestones/${milestoneId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  /**
   * Send notification for payment received.
   *
   * @param userId - User ID
   * @param amount - Payment amount
   * @param bookingId - Booking ID
   * @param bookingNumber - Booking number
   * @param sendEmail - Whether to send email notification
   * @param userEmail - User email for email notifications
   * @param userName - User name for email notifications
   */
  async sendPaymentReceived(
    userId: number,
    amount: number,
    bookingId: number,
    bookingNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.PAYMENT_RECEIVED,
      title: 'Payment Received',
      body: `You received ₱${amount.toFixed(2)} for booking ${bookingNumber}.`,
      entity_type: 'booking',
      entity_id: bookingId,
      action_url: `/bookings/${bookingId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  // =====================================================
  // Sales Order Notification Helpers
  // =====================================================

  /**
   * Send notification for order placed.
   */
  async sendOrderPlaced(
    userId: number,
    orderId: number,
    orderNumber: string,
    totalAmount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_PLACED,
      title: 'Order Placed Successfully',
      body: `Your order ${orderNumber} for ₱${totalAmount.toFixed(2)} has been placed successfully.`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: totalAmount,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: orderDetails?.sellerName,
    });
  }

  /**
   * Send notification for order confirmed.
   */
  async sendOrderConfirmed(
    userId: number,
    orderId: number,
    orderNumber: string,
    sellerName: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_CONFIRMED,
      title: 'Order Confirmed',
      body: `Your order ${orderNumber} has been confirmed by ${sellerName}.`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: sellerName,
      amount: orderDetails?.totalAmount,
    });
  }

  /**
   * Send notification for order processing.
   */
  async sendOrderProcessing(
    userId: number,
    orderId: number,
    orderNumber: string,
    sellerName: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_PROCESSING,
      title: 'Order Being Processed',
      body: `Your order ${orderNumber} is now being prepared by ${sellerName} and will be shipped soon.`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: sellerName,
      amount: orderDetails?.totalAmount,
    });
  }

  /**
   * Send notification for order ready to ship.
   */
  async sendOrderReadyToShip(
    userId: number,
    orderId: number,
    orderNumber: string,
    sellerName: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_READY_TO_SHIP,
      title: 'Order Ready to Ship',
      body: `Great news! Your order ${orderNumber} is packed and ready to be shipped by ${sellerName}.`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: sellerName,
      amount: orderDetails?.totalAmount,
    });
  }

  /**
   * Send notification for order out for delivery.
   */
  async sendOrderOutForDelivery(
    userId: number,
    orderId: number,
    orderNumber: string,
    trackingNumber?: string,
    shippingProvider?: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    let body = `Your order ${orderNumber} is out for delivery and will arrive soon!`;
    if (trackingNumber) {
      body = `Your order ${orderNumber} is out for delivery! Tracking: ${trackingNumber}`;
    }

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_OUT_FOR_DELIVERY,
      title: 'Out for Delivery',
      body,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: orderDetails?.sellerName,
      amount: orderDetails?.totalAmount,
      tracking_number: trackingNumber,
      shipping_provider: shippingProvider,
    });
  }

  /**
   * Send notification for order shipped.
   */
  async sendOrderShipped(
    userId: number,
    orderId: number,
    orderNumber: string,
    trackingNumber?: string,
    shippingProvider?: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    let body = `Your order ${orderNumber} has been shipped.`;
    if (trackingNumber && shippingProvider) {
      body = `Your order ${orderNumber} has been shipped via ${shippingProvider}. Tracking number: ${trackingNumber}`;
    } else if (trackingNumber) {
      body = `Your order ${orderNumber} has been shipped. Tracking number: ${trackingNumber}`;
    }

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_SHIPPED,
      title: 'Order Shipped',
      body,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: orderDetails?.sellerName,
      amount: orderDetails?.totalAmount,
      tracking_number: trackingNumber,
      shipping_provider: shippingProvider,
      estimated_delivery: orderDetails?.estimatedDelivery,
    });
  }

  /**
   * Send notification for order delivered.
   */
  async sendOrderDelivered(
    userId: number,
    orderId: number,
    orderNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_DELIVERED,
      title: 'Order Delivered',
      body: `Your order ${orderNumber} has been delivered. Thank you for your purchase!`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      seller_name: orderDetails?.sellerName,
      amount: orderDetails?.totalAmount,
    });
  }

  /**
   * Send notification for order completed.
   */
  async sendOrderCompleted(
    userId: number,
    orderId: number,
    orderNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_COMPLETED,
      title: 'Order Completed',
      body: `Your order ${orderNumber} has been completed. We hope you enjoyed your purchase!`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  /**
   * Send notification for order cancelled.
   */
  async sendOrderCancelled(
    userId: number,
    orderId: number,
    orderNumber: string,
    reason?: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    const body = reason
      ? `Your order ${orderNumber} has been cancelled. Reason: ${reason}`
      : `Your order ${orderNumber} has been cancelled.`;

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.ORDER_CANCELLED,
      title: 'Order Cancelled',
      body,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  /**
   * Send notification to seller for new order received.
   */
  async sendNewOrderToSeller(
    sellerId: number,
    orderId: number,
    orderNumber: string,
    customerName: string,
    totalAmount: number,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.ORDER_PLACED,
      title: 'New Order Received',
      body: `You have a new order ${orderNumber} from ${customerName} for ₱${totalAmount.toFixed(2)}.`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/sales-orders?orderId=${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      amount: totalAmount,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      customer_name: customerName,
    });
  }

  /**
   * Send notification to seller when order is cancelled.
   */
  async sendOrderCancelledToSeller(
    sellerId: number,
    orderId: number,
    orderNumber: string,
    customerName: string,
    reason?: string,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    const body = reason
      ? `Order ${orderNumber} from ${customerName} has been cancelled. Reason: ${reason}`
      : `Order ${orderNumber} from ${customerName} has been cancelled.`;

    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.ORDER_CANCELLED,
      title: 'Order Cancelled',
      body,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/sales-orders?orderId=${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      customer_name: customerName,
    });
  }

  /**
   * Send notification to seller when order is completed by customer.
   */
  async sendOrderCompletedToSeller(
    sellerId: number,
    orderId: number,
    orderNumber: string,
    customerName: string,
    totalAmount: number,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
    orderDetails?: OrderNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.ORDER_COMPLETED,
      title: 'Order Completed',
      body: `Order ${orderNumber} from ${customerName} has been marked as completed. Amount: ₱${totalAmount.toFixed(2)}`,
      entity_type: 'sales_order',
      entity_id: orderId,
      action_url: `/sales-orders?orderId=${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      amount: totalAmount,
      order_number: orderNumber,
      order_items: orderDetails?.orderItems,
      subtotal: orderDetails?.subtotal,
      shipping_amount: orderDetails?.shippingAmount,
      tax_amount: orderDetails?.taxAmount,
      discount_amount: orderDetails?.discountAmount,
      shipping_address: orderDetails?.shippingAddress,
      customer_name: customerName,
    });
  }

  // =====================================================
  // Payment Notification Helpers
  // =====================================================

  /**
   * Send notification for payment success.
   */
  async sendPaymentSuccess(
    userId: number,
    orderId: number,
    orderNumber: string,
    amount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.PAYMENT_SUCCESSFUL,
      title: 'Payment Successful',
      body: `Your payment of ₱${amount.toFixed(2)} for order ${orderNumber} was successful.`,
      entity_type: 'checkout_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  /**
   * Send notification when admin confirms a membership payment.
   */
  async sendMembershipPaymentConfirmed(
    userId: number,
    membershipId: number,
    amount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    isRenewal: boolean = false,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.MEMBERSHIP_PAYMENT_CONFIRMED,
      title: isRenewal ? 'Membership Renewed' : 'Membership Activated',
      body: isRenewal
        ? `Your membership payment of ₱${amount.toFixed(2)} has been confirmed. Your membership has been renewed.`
        : `Your membership payment of ₱${amount.toFixed(2)} has been confirmed. Your membership is now active.`,
      entity_type: 'membership',
      entity_id: membershipId,
      action_url: `/membership`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  /**
   * Send notification when admin voids a membership payment.
   */
  async sendMembershipPaymentVoided(
    userId: number,
    membershipId: number,
    amount: number,
    reason?: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    const body = reason
      ? `Your membership payment of ₱${amount.toFixed(2)} was voided. Reason: ${reason}`
      : `Your membership payment of ₱${amount.toFixed(2)} was voided. Please contact support if you have questions.`;

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.MEMBERSHIP_PAYMENT_VOIDED,
      title: 'Membership Payment Voided',
      body,
      entity_type: 'membership',
      entity_id: membershipId,
      action_url: `/membership`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  /**
   * Send notification when user submits a membership payment (awaiting admin confirmation).
   */
  async sendMembershipPaymentSubmitted(
    userId: number,
    membershipId: number,
    amount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.MEMBERSHIP_PAYMENT_SUBMITTED,
      title: 'Payment Submitted',
      body: `Your membership payment of ₱${amount.toFixed(2)} has been submitted and is awaiting confirmation.`,
      entity_type: 'membership',
      entity_id: membershipId,
      action_url: `/membership`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  /**
   * Send notification to admin when a user submits a membership payment.
   */
  async sendMembershipPaymentSubmittedAdmin(
    membershipId: number,
    userFirstName: string,
    userLastName: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: 1,
      type: NotificationTypeEnum.MEMBERSHIP_PAYMENT_SUBMITTED_ADMIN,
      title: 'New Membership Payment',
      body: `${userFirstName} ${userLastName} submitted a membership payment of ₱${amount.toFixed(2)} awaiting confirmation.`,
      entity_type: 'membership',
      entity_id: membershipId,
      action_url: `/admin/memberships/${membershipId}`,
      send_push: true,
      send_email: true,
      user_email: this.configService.get('app.adminEmail', { infer: true }),
      user_name: `${userFirstName} ${userLastName}`.trim(),
      amount: amount,
    });
  }

  /**
   * Send notification when user submits a manual QR payment (awaiting admin confirmation).
   */
  async sendPaymentSubmitted(
    userId: number,
    orderId: number,
    orderNumber: string,
    amount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.PAYMENT_SUBMITTED,
      title: 'Payment Submitted',
      body: `Your payment of ₱${amount.toFixed(2)} for order ${orderNumber} has been submitted and is awaiting confirmation.`,
      entity_type: 'checkout_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: amount,
    });
  }

  /**
   * Send notification for payment failed.
   */
  async sendPaymentFailed(
    userId: number,
    orderId: number,
    orderNumber: string,
    reason?: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    const body = reason
      ? `Payment for order ${orderNumber} failed. Reason: ${reason}`
      : `Payment for order ${orderNumber} failed. Please try again.`;

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.PAYMENT_FAILED,
      title: 'Payment Failed',
      body,
      entity_type: 'checkout_order',
      entity_id: orderId,
      action_url: `/orders/${orderId}/payment`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  // =====================================================
  // Return/Refund Notification Helpers
  // =====================================================

  /**
   * Send notification to seller for return requested.
   */
  async sendReturnRequested(
    sellerId: number,
    returnId: number,
    returnNumber: string,
    orderNumber: string,
    customerName: string,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.RETURN_REQUESTED,
      title: 'Return Request Received',
      body: `${customerName} has requested a return (${returnNumber}) for order ${orderNumber}.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/seller/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      order_number: orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      refund_amount: returnDetails?.refundAmount,
      return_reason: returnDetails?.returnReason,
      customer_name: customerName,
    });
  }

  async sendReturnRequestedToBuyer(
    userId: number,
    returnId: number,
    returnNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    const orderNumber = returnDetails?.orderNumber;

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_REQUESTED,
      title: 'Return Request Submitted',
      body: orderNumber
        ? `Your return request ${returnNumber} for order ${orderNumber} has been submitted.`
        : `Your return request ${returnNumber} has been submitted.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      refund_amount: returnDetails?.refundAmount,
      return_reason: returnDetails?.returnReason,
      seller_name: returnDetails?.sellerName,
    });
  }

  async sendReturnRejected(
    userId: number,
    returnId: number,
    returnNumber: string,
    rejectionReason: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    const orderNumber = returnDetails?.orderNumber;

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_REJECTED,
      title: 'Return Rejected',
      body: orderNumber
        ? `Your return request ${returnNumber} for order ${orderNumber} was rejected. Reason: ${rejectionReason}`
        : `Your return request ${returnNumber} was rejected. Reason: ${rejectionReason}`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      return_reason: rejectionReason,
      seller_name: returnDetails?.sellerName,
    });
  }

  /**
   * Send notification to seller when return is approved.
   */
  async sendReturnApprovedToSeller(
    sellerId: number,
    returnId: number,
    returnNumber: string,
    orderNumber: string,
    customerName: string,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.RETURN_APPROVED,
      title: 'Return Approved',
      body: `Return request ${returnNumber} for order ${orderNumber} from ${customerName} has been approved.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/seller/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      order_number: orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      refund_amount: returnDetails?.refundAmount,
      return_reason: returnDetails?.returnReason,
      customer_name: customerName,
    });
  }

  /**
   * Send notification for return approved.
   */
  async sendReturnApproved(
    userId: number,
    returnId: number,
    returnNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_APPROVED,
      title: 'Return Approved',
      body: `Your return request ${returnNumber} has been approved. Please prepare the item for pickup.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      order_number: returnDetails?.orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      refund_amount: returnDetails?.refundAmount,
      return_reason: returnDetails?.returnReason,
      seller_name: returnDetails?.sellerName,
    });
  }

  /**
   * Send notification for return pickup scheduled.
   */
  async sendReturnPickupScheduled(
    userId: number,
    returnId: number,
    returnNumber: string,
    pickupDate: Date,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    const formattedDate = pickupDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_PICKUP_SCHEDULED,
      title: 'Pickup Scheduled',
      body: `Pickup for your return ${returnNumber} is scheduled for ${formattedDate}.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  /**
   * Send notification for return picked up.
   */
  async sendReturnPickedUp(
    userId: number,
    returnId: number,
    returnNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_PICKED_UP,
      title: 'Item Picked Up',
      body: `Your return item for ${returnNumber} has been picked up and is on its way to the seller.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  async sendReturnPickedUpToSeller(
    sellerId: number,
    returnId: number,
    returnNumber: string,
    orderNumber: string,
    customerName: string,
    sendEmail: boolean = false,
    sellerEmail?: string,
    sellerName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: sellerId,
      type: NotificationTypeEnum.RETURN_PICKED_UP,
      title: 'Return Picked Up',
      body: `Return item for ${returnNumber} (order ${orderNumber}) from ${customerName} has been picked up and is on its way to you.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/seller/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: sellerEmail,
      user_name: sellerName,
      order_number: orderNumber,
      return_number: returnNumber,
      customer_name: customerName,
    });
  }

  /**
   * Send notification for return received by seller.
   */
  async sendReturnReceived(
    userId: number,
    returnId: number,
    returnNumber: string,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.RETURN_RECEIVED,
      title: 'Return Received',
      body: `Your returned item for ${returnNumber} has been received. Refund is being processed.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
    });
  }

  /**
   * Send notification for refund processed.
   */
  async sendRefundProcessed(
    userId: number,
    returnId: number,
    returnNumber: string,
    refundAmount: number,
    sendEmail: boolean = false,
    userEmail?: string,
    userName?: string,
    returnDetails?: ReturnNotificationDetails,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.REFUND_PROCESSED,
      title: 'Refund Processed',
      body: `Your refund of ${formatCurrency(refundAmount)} for return ${returnNumber} has been processed.`,
      entity_type: 'return_request',
      entity_id: returnId,
      action_url: `/returns/${returnId}`,
      send_push: true,
      send_email: sendEmail,
      user_email: userEmail,
      user_name: userName,
      amount: refundAmount,
      order_number: returnDetails?.orderNumber,
      return_number: returnNumber,
      return_items: returnDetails?.returnItems,
      refund_amount: refundAmount,
      seller_name: returnDetails?.sellerName,
    });
  }

  /**
   * Send notification when seller earnings are credited to wallet after order completion.
   */
  async sendEarningsCredited(
    userId: number,
    salesOrderId: number,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_EARNINGS_CREDITED,
      title: 'Earnings Credited',
      body: `₱${amount.toFixed(2)} has been credited to your wallet from Order #${salesOrderId}.`,
      entity_type: 'sales_order',
      entity_id: salesOrderId,
      action_url: `/wallet`,
      send_push: true,
      send_email: false,
    });
  }

  async sendWithdrawalRequested(
    userId: number,
    withdrawalId: number,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WITHDRAWAL_REQUESTED,
      title: 'Withdrawal Requested',
      body: `Your withdrawal request for ₱${amount.toFixed(2)} has been submitted and is pending review.`,
      entity_type: 'wallet_withdrawal',
      entity_id: withdrawalId,
      action_url: `/wallet/withdrawals/${withdrawalId}`,
      send_push: true,
      send_email: false,
    });
  }

  async sendWithdrawalProcessing(
    userId: number,
    withdrawalId: number,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WITHDRAWAL_PROCESSING,
      title: 'Withdrawal Processing',
      body: `Your withdrawal of ₱${amount.toFixed(2)} is now being processed. Funds will be transferred to your bank account shortly.`,
      entity_type: 'wallet_withdrawal',
      entity_id: withdrawalId,
      action_url: `/wallet/withdrawals/${withdrawalId}`,
      send_push: true,
      send_email: false,
    });
  }

  async sendWithdrawalCompleted(
    userId: number,
    withdrawalId: number,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WITHDRAWAL_COMPLETED,
      title: 'Withdrawal Completed',
      body: `Your withdrawal of ₱${amount.toFixed(2)} has been completed. Funds have been transferred to your bank account.`,
      entity_type: 'wallet_withdrawal',
      entity_id: withdrawalId,
      action_url: `/wallet/withdrawals/${withdrawalId}`,
      send_push: true,
      send_email: false,
    });
  }

  async sendWithdrawalFailed(
    userId: number,
    withdrawalId: number,
    amount: number,
    reason: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WITHDRAWAL_FAILED,
      title: 'Withdrawal Failed',
      body: `Your withdrawal of ₱${amount.toFixed(2)} has failed: ${reason}. The amount has been returned to your wallet.`,
      entity_type: 'wallet_withdrawal',
      entity_id: withdrawalId,
      action_url: `/wallet/withdrawals/${withdrawalId}`,
      send_push: true,
      send_email: false,
    });
  }

  async sendReturnDeduction(
    userId: number,
    returnRequestId: number,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WALLET_RETURN_DEDUCTION,
      title: 'Return Deduction Applied',
      body: `₱${amount.toFixed(2)} has been deducted from your wallet for return request #${returnRequestId}.`,
      entity_type: 'return_request',
      entity_id: returnRequestId,
      action_url: `/wallet`,
      send_push: true,
      send_email: false,
    });
  }

  async sendDebtFlagged(
    userId: number,
    returnRequestId: number,
    debtAmount: number,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: NotificationTypeEnum.SELLER_WALLET_DEBT_FLAGGED,
      title: 'Wallet Debt Recorded',
      body: `A debt of ₱${debtAmount.toFixed(2)} has been recorded on your wallet from return request #${returnRequestId}. This will be deducted from future earnings.`,
      entity_type: 'return_request',
      entity_id: returnRequestId,
      action_url: `/wallet`,
      send_push: true,
      send_email: false,
    });
  }

  /**
   * Send WebSocket notification and update unread count for user.
   *
   * @param userId - User ID
   * @param notification - Notification to send
   */
  private async sendWebSocketNotification(
    userId: number,
    notification: Notification,
  ): Promise<void> {
    try {
      this.notificationsGateway.sendToUser(userId, notification);
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCount(userId, unreadCount);
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
    }
  }

  /**
   * Send WebSocket notification read event and update unread count.
   *
   * @param userId - User ID
   * @param notificationId - Notification ID that was read
   */
  private async sendWebSocketNotificationRead(
    userId: number,
    notificationId: number,
  ): Promise<void> {
    try {
      this.notificationsGateway.sendNotificationRead(userId, notificationId);
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCount(userId, unreadCount);
    } catch (error) {
      console.error('Failed to send WebSocket read notification:', error);
    }
  }

  /**
   * Send WebSocket all notifications read event and reset unread count.
   *
   * @param userId - User ID
   */
  private sendWebSocketAllNotificationsRead(userId: number): void {
    try {
      this.notificationsGateway.sendAllNotificationsRead(userId);
      this.notificationsGateway.sendUnreadCount(userId, 0);
    } catch (error) {
      console.error('Failed to send WebSocket read all notification:', error);
    }
  }

  /**
   * Send email notification.
   *
   * @param input - Notification DTO containing email data
   */
  private async sendEmailNotification(
    input: CreateNotificationDto,
  ): Promise<void> {
    try {
      await this.mailService.sendNotificationEmail({
        to: input.user_email!,
        data: {
          userName: input.user_name || 'User',
          title: input.title,
          body: input.body || '',
          type: input.type,
          entityType: input.entity_type,
          entityId: input.entity_id,
          actionUrl: input.action_url,
          amount: input.amount,
          // Order-specific fields
          orderNumber: input.order_number,
          orderItems: input.order_items,
          subtotal: input.subtotal,
          shippingAmount: input.shipping_amount,
          taxAmount: input.tax_amount,
          discountAmount: input.discount_amount,
          shippingAddress: input.shipping_address,
          trackingNumber: input.tracking_number,
          shippingProvider: input.shipping_provider,
          estimatedDelivery: input.estimated_delivery,
          sellerName: input.seller_name,
          customerName: input.customer_name,
          // Return-specific fields
          returnNumber: input.return_number,
          returnItems: input.return_items,
          refundAmount: input.refund_amount,
          refund_amount: input.refund_amount, // Add snake_case for template compatibility
          returnReason: input.return_reason,
          pickupAddress: input.pickup_address,
          pickupDate: input.pickup_date,
        },
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  }
}
