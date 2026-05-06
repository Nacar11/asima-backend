import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';

// Sample product images from placeholder service (valid URLs)
const SAMPLE_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop', // Watch
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop', // Headphones
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop', // Shoe
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=200&fit=crop', // Camera
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200&h=200&fit=crop', // Bag
];

interface SendTestEmailDto {
  email: string;
  template?:
    | 'all'
    | 'auth'
    | 'order'
    | 'order-buyer'
    | 'order-seller'
    | 'return'
    | 'payment'
    | 'booking';
}

@ApiTags('Mail Test')
@Controller('api/v1/mail-test')
export class MailTestController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test emails for all or specific templates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        template: {
          type: 'string',
          enum: [
            'all',
            'auth',
            'order',
            'order-buyer',
            'order-seller',
            'return',
            'payment',
            'booking',
          ],
          default: 'all',
        },
      },
      required: ['email'],
    },
  })
  async sendTestEmails(@Body() dto: SendTestEmailDto) {
    const { email, template = 'all' } = dto;
    const results: { template: string; status: string; error?: string }[] = [];

    // Generate test data
    const testData = this.generateTestData();

    try {
      // Auth templates
      if (template === 'all' || template === 'auth') {
        results.push(...(await this.sendAuthEmails(email, testData)));
      }

      // Order templates (buyer)
      if (
        template === 'all' ||
        template === 'order' ||
        template === 'order-buyer'
      ) {
        results.push(...(await this.sendOrderBuyerEmails(email, testData)));
      }

      // Order templates (seller)
      if (
        template === 'all' ||
        template === 'order' ||
        template === 'order-seller'
      ) {
        results.push(...(await this.sendOrderSellerEmails(email, testData)));
      }

      // Return templates
      if (template === 'all' || template === 'return') {
        results.push(...(await this.sendReturnEmails(email, testData)));
      }

      // Payment templates
      if (template === 'all' || template === 'payment') {
        results.push(...(await this.sendPaymentEmails(email, testData)));
      }

      // Booking templates
      if (template === 'all' || template === 'booking') {
        results.push(...(await this.sendBookingEmails(email, testData)));
      }
    } catch (error) {
      results.push({
        template: 'unknown',
        status: 'error',
        error: error.message,
      });
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failCount = results.filter((r) => r.status === 'error').length;

    return {
      message: `Sent ${successCount} test emails, ${failCount} failed`,
      results,
    };
  }

  private generateTestData() {
    return {
      userName: 'John Doe',
      customerName: 'John Doe',
      sellerName: 'Premium Electronics Store',
      orderId: 12345,
      orderNumber: 'ORD-2024-00012345',
      returnNumber: 'RET-2024-00000789',
      amount: 15999.0,
      subtotal: 14499.0,
      shippingAmount: 150.0,
      taxAmount: 1350.0,
      discountAmount: 500.0,
      refundAmount: 7500.0,
      trackingNumber: 'PH123456789012',
      shippingProvider: 'J&T Express',
      estimatedDelivery: 'January 25, 2024',
      shippingAddress:
        '123 Main Street, Brgy. San Antonio, Makati City, Metro Manila, 1234',
      pickupAddress:
        '456 Secondary Ave, Brgy. Poblacion, Quezon City, Metro Manila, 1100',
      pickupDate: 'January 26, 2024, 9:00 AM - 12:00 PM',
      returnReason: 'Item received was damaged during shipping',
      otp: '847291',
      hash: 'abc123def456',
      tokenExpires: Date.now() + 15 * 60 * 1000,
      orderItems: [
        {
          product_name: 'Premium Wireless Headphones',
          variant_name: 'Black / Bluetooth 5.0',
          image_url: SAMPLE_PRODUCT_IMAGES[1],
          quantity: 1,
          unit_price: 4999.0,
          total_price: 4999.0,
        },
        {
          product_name: 'Smart Watch Series 5',
          variant_name: 'Silver / 44mm',
          image_url: SAMPLE_PRODUCT_IMAGES[0],
          quantity: 1,
          unit_price: 8500.0,
          total_price: 8500.0,
        },
        {
          product_name: 'Leather Camera Bag',
          variant_name: 'Brown',
          image_url: SAMPLE_PRODUCT_IMAGES[4],
          quantity: 1,
          unit_price: 1000.0,
          total_price: 1000.0,
        },
      ],
      returnItems: [
        {
          product_name: 'Smart Watch Series 5',
          variant_name: 'Silver / 44mm',
          image_url: SAMPLE_PRODUCT_IMAGES[0],
          quantity_returning: 1,
          quantity_ordered: 1,
          unit_price: 8500.0,
          return_amount: 8500.0,
        },
      ],
    };
  }

  private async sendAuthEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    // Activation email
    try {
      await this.mailService.userSignUp({
        to: email,
        data: {
          hash: testData.hash,
          otp: testData.otp,
          tokenExpires: testData.tokenExpires,
        },
      });
      results.push({ template: 'activation', status: 'success' });
    } catch (error) {
      results.push({
        template: 'activation',
        status: 'error',
        error: error.message,
      });
    }

    // Forgot password email
    try {
      await this.mailService.forgotPassword({
        to: email,
        data: {
          hash: testData.hash,
          otp: testData.otp,
          tokenExpires: testData.tokenExpires,
        },
      });
      results.push({ template: 'reset-password', status: 'success' });
    } catch (error) {
      results.push({
        template: 'reset-password',
        status: 'error',
        error: error.message,
      });
    }

    // Confirm new email
    try {
      await this.mailService.confirmNewEmail({
        to: email,
        data: { hash: testData.hash },
      });
      results.push({ template: 'confirm-new-email', status: 'success' });
    } catch (error) {
      results.push({
        template: 'confirm-new-email',
        status: 'error',
        error: error.message,
      });
    }

    // Email change OTP
    try {
      await this.mailService.sendEmailChangeOtp({
        to: email,
        data: {
          otp: testData.otp,
          newEmail: email,
          tokenExpires: testData.tokenExpires,
        },
      });
      results.push({ template: 'email-change-otp', status: 'success' });
    } catch (error) {
      results.push({
        template: 'email-change-otp',
        status: 'error',
        error: error.message,
      });
    }

    return results;
  }

  private async sendOrderBuyerEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    const buyerOrderNotifications = [
      {
        type: NotificationTypeEnum.ORDER_CONFIRMED,
        title: 'Order Confirmed',
        body: `Great news! Your order #${testData.orderNumber} has been confirmed and is being prepared.`,
      },
      {
        type: NotificationTypeEnum.ORDER_PROCESSING,
        title: 'Order Processing',
        body: `Your order #${testData.orderNumber} is now being processed by the seller.`,
      },
      {
        type: NotificationTypeEnum.ORDER_READY_TO_SHIP,
        title: 'Order Ready to Ship',
        body: `Your order #${testData.orderNumber} is packed and ready to be shipped.`,
      },
      {
        type: NotificationTypeEnum.ORDER_SHIPPED,
        title: 'Order Shipped',
        body: `Your order #${testData.orderNumber} has been shipped and is on its way to you.`,
      },
      {
        type: NotificationTypeEnum.ORDER_OUT_FOR_DELIVERY,
        title: 'Out for Delivery',
        body: `Your order #${testData.orderNumber} is out for delivery today!`,
      },
      {
        type: NotificationTypeEnum.ORDER_DELIVERED,
        title: 'Order Delivered',
        body: `Your order #${testData.orderNumber} has been delivered successfully.`,
      },
      {
        type: NotificationTypeEnum.ORDER_CANCELLED,
        title: 'Order Cancelled',
        body: `Your order #${testData.orderNumber} has been cancelled as requested.`,
      },
    ];

    for (const notification of buyerOrderNotifications) {
      try {
        await this.mailService.sendNotificationEmail({
          to: email,
          data: {
            userName: testData.userName,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            entityType: 'sales_order',
            entityId: testData.orderId,
            orderNumber: testData.orderNumber,
            orderItems: testData.orderItems,
            subtotal: testData.subtotal,
            shippingAmount: testData.shippingAmount,
            taxAmount: testData.taxAmount,
            discountAmount: testData.discountAmount,
            amount: testData.amount,
            shippingAddress: testData.shippingAddress,
            trackingNumber: testData.trackingNumber,
            shippingProvider: testData.shippingProvider,
            estimatedDelivery: testData.estimatedDelivery,
            sellerName: testData.sellerName,
          },
        });
        results.push({
          template: `order-buyer-${notification.type}`,
          status: 'success',
        });
      } catch (error) {
        results.push({
          template: `order-buyer-${notification.type}`,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async sendOrderSellerEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    // Order Placed (for seller)
    try {
      await this.mailService.sendNotificationEmail({
        to: email,
        data: {
          userName: testData.sellerName,
          title: 'New Order Received',
          body: `You have received a new order #${testData.orderNumber} from ${testData.customerName}.`,
          type: NotificationTypeEnum.ORDER_PLACED,
          entityType: 'sales_order',
          entityId: testData.orderId,
          actionUrl: `https://example.com/seller/orders/${testData.orderId}`,
          orderNumber: testData.orderNumber,
          orderItems: testData.orderItems,
          subtotal: testData.subtotal,
          shippingAmount: testData.shippingAmount,
          taxAmount: testData.taxAmount,
          amount: testData.amount,
          shippingAddress: testData.shippingAddress,
          customerName: testData.customerName,
        },
      });
      results.push({
        template: 'order-seller-order_placed',
        status: 'success',
      });
    } catch (error) {
      results.push({
        template: 'order-seller-order_placed',
        status: 'error',
        error: error.message,
      });
    }

    return results;
  }

  private async sendReturnEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    const returnNotifications = [
      {
        type: NotificationTypeEnum.RETURN_REQUESTED,
        title: 'Return Request Submitted',
        body: `Your return request #${testData.returnNumber} has been submitted successfully.`,
      },
      {
        type: NotificationTypeEnum.RETURN_APPROVED,
        title: 'Return Request Approved',
        body: `Your return request #${testData.returnNumber} has been approved.`,
      },
      {
        type: NotificationTypeEnum.RETURN_REJECTED,
        title: 'Return Request Rejected',
        body: `Unfortunately, your return request #${testData.returnNumber} has been rejected.`,
      },
      {
        type: NotificationTypeEnum.RETURN_PICKUP_SCHEDULED,
        title: 'Return Pickup Scheduled',
        body: `A pickup has been scheduled for your return #${testData.returnNumber}.`,
      },
      {
        type: NotificationTypeEnum.RETURN_PICKED_UP,
        title: 'Return Package Picked Up',
        body: `Your return package for #${testData.returnNumber} has been picked up.`,
      },
      {
        type: NotificationTypeEnum.RETURN_RECEIVED,
        title: 'Return Package Received',
        body: `Your return package for #${testData.returnNumber} has been received by the seller.`,
      },
      {
        type: NotificationTypeEnum.REFUND_PROCESSED,
        title: 'Refund Processed',
        body: `Your refund for return #${testData.returnNumber} has been processed.`,
      },
    ];

    for (const notification of returnNotifications) {
      try {
        await this.mailService.sendNotificationEmail({
          to: email,
          data: {
            userName: testData.userName,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            entityType: 'return_request',
            entityId: 789,
            returnNumber: testData.returnNumber,
            returnItems: testData.returnItems,
            returnReason: testData.returnReason,
            refundAmount: testData.refundAmount,
            pickupAddress: testData.pickupAddress,
            pickupDate: testData.pickupDate,
            sellerName: testData.sellerName,
          },
        });
        results.push({
          template: `return-${notification.type}`,
          status: 'success',
        });
      } catch (error) {
        results.push({
          template: `return-${notification.type}`,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async sendPaymentEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    const paymentNotifications = [
      {
        type: NotificationTypeEnum.PAYMENT_SUCCESSFUL,
        title: 'Payment Successful',
        body: `Your payment of ₱${testData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} for order #${testData.orderNumber} was successful.`,
      },
      {
        type: NotificationTypeEnum.PAYMENT_FAILED,
        title: 'Payment Failed',
        body: `Your payment for order #${testData.orderNumber} was unsuccessful. Please try again.`,
      },
      {
        type: NotificationTypeEnum.PAYMENT_RECEIVED,
        title: 'Payment Received',
        body: `Payment of ₱${testData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} has been received for order #${testData.orderNumber}.`,
      },
    ];

    for (const notification of paymentNotifications) {
      try {
        await this.mailService.sendNotificationEmail({
          to: email,
          data: {
            userName: testData.userName,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            entityType: 'payment',
            entityId: 456,
            amount: testData.amount,
            orderNumber: testData.orderNumber,
          },
        });
        results.push({
          template: `payment-${notification.type}`,
          status: 'success',
        });
      } catch (error) {
        results.push({
          template: `payment-${notification.type}`,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async sendBookingEmails(
    email: string,
    testData: ReturnType<typeof this.generateTestData>,
  ) {
    const results: { template: string; status: string; error?: string }[] = [];

    // Booking confirmed
    try {
      await this.mailService.sendNotificationEmail({
        to: email,
        data: {
          userName: testData.userName,
          title: 'Booking Confirmed',
          body: 'Your service booking has been confirmed. The service provider will contact you soon.',
          type: NotificationTypeEnum.BOOKING_CONFIRMED,
          entityType: 'booking',
          entityId: 123,
          amount: 5000.0,
          sellerName: 'Home Services Pro',
        },
      });
      results.push({ template: 'booking-confirmed', status: 'success' });
    } catch (error) {
      results.push({
        template: 'booking-confirmed',
        status: 'error',
        error: error.message,
      });
    }

    // Milestone submitted
    try {
      await this.mailService.sendNotificationEmail({
        to: email,
        data: {
          userName: testData.userName,
          title: 'Milestone Submitted',
          body: 'A milestone for your booking has been completed and submitted for review.',
          type: NotificationTypeEnum.MILESTONE_SUBMITTED,
          entityType: 'booking_milestone',
          entityId: 456,
          amount: 2500.0,
          sellerName: 'Home Services Pro',
        },
      });
      results.push({ template: 'milestone-submitted', status: 'success' });
    } catch (error) {
      results.push({
        template: 'milestone-submitted',
        status: 'error',
        error: error.message,
      });
    }

    return results;
  }
}
