import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { OrderTrackingService } from './order-tracking.service';
import { OrderTrackingEvent } from './domain/order-tracking-event';
import { BaseSalesOrderRepository } from '@/sales-orders/persistence/base-sales-order.repository';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

/**
 * Response DTO for order tracking with order details
 */
export interface OrderTrackingResponse {
  order_id: number;
  order_number: string;
  status: OrderStatusEnum;
  shipping_provider: string | null;
  tracking_number: string | null;
  events: OrderTrackingEvent[];
}

/**
 * Order Tracking Controller
 * Provides customer-facing tracking timeline endpoints
 */
@ApiTags('Order Tracking')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'sales-orders',
  version: '1',
})
export class OrderTrackingController {
  constructor(
    private readonly orderTrackingService: OrderTrackingService,
    private readonly salesOrderRepository: BaseSalesOrderRepository,
  ) {}

  /**
   * GET /sales-orders/:orderId/tracking
   * Get full tracking timeline for a customer's order
   */
  @Get(':orderId/tracking')
  @ApiOperation({
    summary: 'Get order tracking timeline',
    description:
      'Get all tracking events for the specified order with order details. Customers can only view their own orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order tracking details with events',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderTracking(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: User,
  ): Promise<OrderTrackingResponse> {
    const order = await this.salesOrderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (!user.system_admin && order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const events = await this.orderTrackingService.getEventsByOrderId(orderId);

    return {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      shipping_provider: order.shipping_provider || null,
      tracking_number: order.tracking_number || null,
      events,
    };
  }

  /**
   * GET /sales-orders/:orderId/tracking/latest
   * Get latest tracking event for a customer's order
   */
  @Get(':orderId/tracking/latest')
  @ApiOperation({
    summary: 'Get latest tracking event',
    description: 'Get the most recent tracking event for the specified order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest tracking event',
    type: OrderTrackingEvent,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getLatestOrderTracking(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: User,
  ): Promise<OrderTrackingEvent | null> {
    const order = await this.salesOrderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (!user.system_admin && order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.orderTrackingService.getLatestEventByOrderId(orderId);
  }
}
