import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import {
  SellerSalesOrdersService,
  PaginatedOrders,
} from './seller-sales-orders.service';
import { QuerySellerSalesOrderDto } from './dto/query-seller-sales-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { StatusNotesDto } from './dto/status-notes.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';
import { ReturnRequestsService } from '@/return-requests/return-requests.service';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import {
  ApproveReturnDto,
  RejectReturnDto,
  MarkReceivedDto,
  ProcessRefundDto,
} from '@/return-requests/dto';
import { SalesOrdersService } from '@/sales-orders/sales-orders.service';
import { UpdatePickupStatusDto } from '@/sales-orders/dto/update-pickup-status.dto';

@ApiTags('Seller - Sales Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'seller/sales-orders',
  version: '1',
})
export class SellerSalesOrdersController {
  constructor(
    private readonly service: SellerSalesOrdersService,
    private readonly returnRequestsService: ReturnRequestsService,
    private readonly salesOrdersService: SalesOrdersService,
  ) {}

  /**
   * GET /seller/sales-orders
   * List orders for the logged-in seller
   */
  @Get()
  @Permissions({ SM06: 'View' })
  @ApiOperation({
    summary: 'List orders',
    description:
      'Get orders with pagination and filters. Returns only orders belonging to the logged-in seller.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of items to take (default: 20)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort by created_at (default: DESC)',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    description:
      'Field to sort by (created_at, updated_at, total_amount, order_number, status). Defaults to created_at.',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatusEnum })
  @ApiQuery({ name: 'date_from', required: false, type: String })
  @ApiQuery({ name: 'date_to', required: false, type: String })
  @ApiQuery({
    name: 'order_number',
    required: false,
    type: String,
    description: 'Filter by order number (partial match)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SalesOrder' },
        },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not a seller or admin',
  })
  async findAll(
    @Query() query: QuerySellerSalesOrderDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedOrders> {
    return this.service.findAll(query, user.seller_id);
  }

  /**
   * GET /seller/sales-orders/:id
   * Get order by ID (sellers see their own, superadmins see all)
   */
  @Get(':id')
  @Permissions({ SM06: 'View' })
  @ApiOperation({
    summary: 'Get order details',
    description:
      'Get full order details. Sellers can only view their store orders, superadmins can view all.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: SalesOrder,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.findById(id, user);
  }

  /**
   * GET /seller/sales-orders/:id/tracking
   * Get tracking events for an order
   */
  @Get(':id/tracking')
  @Permissions({ SM06: 'View' })
  @ApiOperation({
    summary: 'Get order tracking events',
    description:
      'Get all tracking events for the specified order. Sellers can only view their store orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tracking events',
    type: OrderTrackingEvent,
    isArray: true,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderTracking(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<OrderTrackingEvent[]> {
    return this.service.getOrderTracking(id, user);
  }

  /**
   * POST /seller/sales-orders/:id/tracking
   * Add manual tracking event (for exceptions/problems only)
   */
  @Post(':id/tracking')
  @Permissions({ SM06: 'Create' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Report delivery exception',
    description:
      'Report a delivery exception or problem. Sellers can only report issues (delivery_exception, exception), not delivery progress updates.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tracking event created',
    type: OrderTrackingEvent,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event type for manual entry',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async addTrackingEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTrackingEventDto,
    @CurrentUser() user: User,
  ): Promise<OrderTrackingEvent> {
    return this.service.addTrackingEvent(id, dto, user);
  }

  /**
   * PATCH /seller/sales-orders/:id
   * Update order details
   */
  @Patch(':id')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Update order',
    description:
      'Update order details including notes, shipping address, and item quantities/prices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order updated',
    type: SalesOrder,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.updateOrder(id, dto, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/confirm
   * Confirm order (pending -> confirmed)
   */
  @Patch(':id/confirm')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Confirm order',
    description: 'Confirm a pending order. Transition: PENDING -> CONFIRMED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order confirmed',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be confirmed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.confirmOrder(id, dto.status_notes, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/process
   * Start processing order (confirmed -> processing)
   */
  @Patch(':id/process')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Start processing order',
    description:
      'Start processing a confirmed order. Transition: CONFIRMED -> PROCESSING.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order processing started',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be processed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async startProcessing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.startProcessing(id, dto.status_notes, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/ready-to-ship
   * Mark order as ready to ship
   */
  @Patch(':id/ready-to-ship')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark order as ready to ship',
    description:
      'Mark order as ready to ship after packing. Transition: PROCESSING -> READY_TO_SHIP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as ready to ship',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be marked as ready to ship',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async readyToShip(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.readyToShip(id, dto.status_notes, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/ship
   * Ship order with tracking info
   */
  @Patch(':id/ship')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Ship order',
    description:
      'Mark order as shipped with tracking information. Transition: READY_TO_SHIP -> SHIPPED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order shipped',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be shipped' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async shipOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShipOrderDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.shipOrder(id, dto, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/out-for-delivery
   * Mark order as out for delivery
   */
  @Patch(':id/out-for-delivery')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark as out for delivery',
    description:
      'Mark order as out for delivery. Transition: SHIPPED -> OUT_FOR_DELIVERY.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as out for delivery',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be marked as out for delivery',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async outForDelivery(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.outForDelivery(id, dto.status_notes, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/deliver
   * Mark order as delivered
   */
  @Patch(':id/deliver')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark as delivered',
    description:
      'Mark order as delivered. Commits stock changes. Transition: SHIPPED/OUT_FOR_DELIVERY -> DELIVERED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order delivered',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be marked as delivered',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deliverOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.deliverOrder(id, dto.status_notes, user);
  }

  /**
   * PATCH /seller/sales-orders/:id/cancel
   * Cancel order with reason
   */
  @Patch(':id/cancel')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Cancel order',
    description:
      'Cancel an order with a reason. Releases reserved stock. Only pending/confirmed/processing orders can be cancelled.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.cancelOrder(
      id,
      dto.reason || '',
      dto.status_notes,
      user,
    );
  }

  /**
   * PATCH /seller/sales-orders/:id/refund
   * Process refund for a returned order
   */
  @Patch(':id/refund')
  @Permissions({ SM06: 'Edit' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Process refund',
    description:
      'Process refund for a returned order. Transition: RETURNED -> REFUNDED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order refunded',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be refunded (not in RETURNED status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async refundOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusNotesDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.service.refundOrder(id, dto.status_notes, user);
  }

  /**
   * DELETE /seller/sales-orders/:id
   * Soft delete order
   */
  @Delete(':id')
  @Permissions({ SM06: 'Delete' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete order',
    description: 'Soft delete an order. Releases reserved stock if applicable.',
  })
  @ApiResponse({ status: 204, description: 'Order deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.service.deleteOrder(id, user);
  }

  // ==================== RETURN REQUEST MANAGEMENT ====================

  /**
   * GET /seller/sales-orders/:id/return
   * Get return request for an order
   */
  @Get(':id/return')
  @Permissions({ SM08: 'View' })
  @ApiOperation({
    summary: 'Get return request',
    description: 'Get the return request details for an order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return request details',
    type: ReturnRequest,
  })
  @ApiResponse({ status: 404, description: 'No return request found' })
  async getReturnRequest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReturnRequest | null> {
    return this.returnRequestsService.getReturnRequestByOrderId(id);
  }

  /**
   * PATCH /seller/sales-orders/:id/return/approve
   * Approve return request
   */
  @Patch(':id/return/approve')
  @Permissions({ SM08: 'Approve' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Approve return request',
    description: 'Approve a pending return request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return request approved',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Return request cannot be approved (not in PENDING status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async approveReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveReturnDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId = await this.service.getSellerIdForUser(user);
    return this.returnRequestsService.approveReturnRequest(
      id,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/sales-orders/:id/return/reject
   * Reject return request
   */
  @Patch(':id/return/reject')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reject return request',
    description: 'Reject a pending return request with a reason.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return request rejected',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Return request cannot be rejected (not in PENDING status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async rejectReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectReturnDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId = await this.service.getSellerIdForUser(user);
    return this.returnRequestsService.rejectReturnRequest(
      id,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/sales-orders/:id/return/receive
   * Mark return as received
   */
  @Patch(':id/return/receive')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark return as received',
    description: 'Mark that the returned items have been received.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return marked as received',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description:
      'Return cannot be marked as received (not in PICKED_UP status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async markReturnReceived(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkReceivedDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId = await this.service.getSellerIdForUser(user);
    return this.returnRequestsService.markReturnReceived(
      id,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/sales-orders/:id/return/refund
   * Process refund for received return
   */
  @Patch(':id/return/refund')
  @Permissions({ SM08: 'Approve' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Process refund',
    description:
      'Process the refund for a received return. Optionally override the calculated refund amount.',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund processed',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Refund cannot be processed (not in RECEIVED status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId = await this.service.getSellerIdForUser(user);
    return this.returnRequestsService.processRefund(id, dto, user, sellerId);
  }

  /**
   * PATCH /seller/sales-orders/:id/pickup-status
   * Update pickup order status (ready_for_pickup → completed)
   */
  @Patch(':id/pickup-status')
  @ApiOperation({
    summary: 'Update pickup status',
    description:
      'Advance a pickup order through ready_for_pickup → completed. Seller/admin only.',
  })
  @ApiResponse({ status: 200, description: 'Status updated', type: SalesOrder })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition or not a pickup order',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updatePickupStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) body: UpdatePickupStatusDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.updatePickupStatus(
      id,
      body.status_notes,
      user,
    );
  }

  /**
   * POST /seller/sales-orders/:id/pickup-no-show
   * Mark a pickup order as customer no-show
   */
  @Post(':id/pickup-no-show')
  @ApiOperation({
    summary: 'Mark pickup no-show',
    description:
      'Cancel a ready_for_pickup order as a customer no-show. Releases inventory.',
  })
  @ApiResponse({
    status: 200,
    description: 'Marked as no-show',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order not in ready_for_pickup status',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async markPickupNoShow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.markPickupNoShow(id, user);
  }

  /**
   * POST /seller/sales-orders/:id/extend-grace-period
   * Extend pickup grace period
   */
  @Post(':id/extend-grace-period')
  @ApiOperation({
    summary: 'Extend pickup grace period',
    description:
      'Adds 30 minutes to the pickup grace period for a ready_for_pickup order. Can be called multiple times; each call accumulates. Delays no-show warning timers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grace period extended',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid extension value or wrong status',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async extendGracePeriod(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.extendPickupGracePeriod(id, 30, user);
  }
}
