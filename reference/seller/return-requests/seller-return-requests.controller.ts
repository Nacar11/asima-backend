import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ReturnRequestsService } from '@/return-requests/return-requests.service';
import {
  ApproveReturnDto,
  RejectReturnDto,
  SchedulePickupDto,
  MarkPickedUpDto,
  MarkReceivedDto,
  ProcessRefundDto,
  QueryReturnRequestDevExtremeDto,
} from '@/return-requests/dto';
import { ProcessPayoutDto } from '@/return-requests/dto/process-payout.dto';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import {
  DRAGONPAY_PAYOUT_PROCESSORS,
  PayoutProcessorOption,
} from '@/checkout-payments/enums/dragonpay-payout-processor.enum';
import { SellerSalesOrdersService } from '@/seller/sales-orders/seller-sales-orders.service';
import {
  DevExtremePaginatedResponseDto,
  DevExtremePaginatedResponse,
} from '@/devextreme/dto/paginated-response';

@ApiTags('Seller - Return Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'seller/return-requests',
  version: '1',
})
export class SellerReturnRequestsController {
  constructor(
    private readonly returnRequestsService: ReturnRequestsService,
    private readonly sellerSalesOrdersService: SellerSalesOrdersService,
  ) {}

  /**
   * GET /seller/return-requests
   * List all return requests for the seller with DevExtreme support
   */
  @Get()
  @Permissions({ SM08: 'View' })
  @ApiOperation({
    summary: 'List return requests',
    description:
      'Get all return requests for the seller. ' +
      'Supports DevExtreme DataGrid filtering, sorting, and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of return requests (DevExtreme format)',
    type: DevExtremePaginatedResponse(ReturnRequest),
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not a seller',
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: QueryReturnRequestDevExtremeDto,
    @CurrentUser() user: User,
  ): Promise<DevExtremePaginatedResponseDto<ReturnRequest>> {
    // Admins/superadmins see all return requests; sellers see only theirs
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.getReturnRequestsForSellerDevExtreme(
      query,
      sellerId,
    );
  }

  /**
   * GET /seller/return-requests/payout-processors
   * Returns available payout processors for the refund payout form.
   */
  @Get('payout-processors')
  @Permissions({ SM08: 'View' })
  @ApiOperation({
    summary: 'Get available payout processors',
    description:
      'Returns the list of DragonPay payout processors (banks, e-wallets, cash pick-up) ' +
      'for the refund payout form. Excludes reserved/inactive processors.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available payout processors',
  })
  getPayoutProcessors(): PayoutProcessorOption[] {
    return DRAGONPAY_PAYOUT_PROCESSORS.filter((p) => !p.reserved);
  }

  /**
   * GET /seller/return-requests/order/:orderId
   * Get return request by order ID
   */
  @Get('order/:orderId')
  @Permissions({ SM08: 'View' })
  @ApiOperation({
    summary: 'Get return request by order ID',
    description: 'Get the return request details for a specific order.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Return request details',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async findByOrderId(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest | null> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.getReturnRequestByOrderIdForSeller(
      orderId,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/approve
   * Approve a return request
   */
  @Patch(':orderId/approve')
  @Permissions({ SM08: 'Approve' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Approve return request',
    description: 'Approve a pending return request. Status must be PENDING.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Return request approved',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async approve(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ApproveReturnDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.approveReturnRequest(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/reject
   * Reject a return request
   */
  @Patch(':orderId/reject')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reject return request',
    description: 'Reject a pending return request. Status must be PENDING.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Return request rejected',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async reject(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: RejectReturnDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.rejectReturnRequest(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/schedule-pickup
   * Schedule pickup for approved return
   */
  @Patch(':orderId/schedule-pickup')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Schedule return pickup',
    description:
      'Schedule a pickup date for the return. Status must be APPROVED.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Pickup scheduled',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async schedulePickup(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: SchedulePickupDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.schedulePickup(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/picked-up
   * Mark return items as picked up from customer
   */
  @Patch(':orderId/picked-up')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark as picked up',
    description:
      'Mark return items as picked up from customer. Status must be PICKUP_SCHEDULED.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Marked as picked up',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async markPickedUp(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: MarkPickedUpDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.markPickedUp(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/receive
   * Mark return items as received at seller location
   */
  @Patch(':orderId/receive')
  @Permissions({ SM08: 'Edit' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Mark as received',
    description:
      'Mark return items as received at seller location. Status must be PICKED_UP.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Marked as received',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async markReceived(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: MarkReceivedDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.markReturnReceived(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  /**
   * PATCH /seller/return-requests/:orderId/refund
   * Process refund after items received
   */
  @Patch(':orderId/refund')
  @Permissions({ SM08: 'Approve' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Process refund',
    description: 'Process the refund for the return. Status must be RECEIVED.',
  })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Refund processed',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async processRefund(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.processRefund(
      orderId,
      dto,
      user,
      sellerId,
    );
  }

  @Patch(':orderId/process-payout')
  @Permissions({ SM08: 'Approve' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Process payment payout for a return refund',
    description:
      'Processes a cash or wallet payout to the customer for a refunded return. ' +
      'Only applicable for orders with payment_refund_status = pending.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Sales order ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Payout processed successfully',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payout request',
  })
  @ApiResponse({
    status: 404,
    description: 'Return request not found',
  })
  async processPaymentPayout(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body(new ValidationPipe({ transform: true })) dto: ProcessPayoutDto,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest> {
    const sellerId =
      await this.sellerSalesOrdersService.getSellerIdForUser(user);
    return this.returnRequestsService.processPaymentPayout(
      orderId,
      dto,
      user,
      sellerId,
    );
  }
}
