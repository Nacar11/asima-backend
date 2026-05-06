import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrder } from './domain/sales-order';
import { CheckoutPreview } from './domain/checkout-preview';
import { PlaceOrderDto } from './dto/place-order.dto';
import { PlaceOrderResponseDto } from './dto/place-order-response.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { SwitchPaymentMethodDto } from './dto/switch-payment-method.dto';
import { UpdatePickupStatusDto } from './dto/update-pickup-status.dto';
import { CheckoutPreviewQueryDto } from './dto/checkout-preview-query.dto';
import { CheckoutPreviewItemsDto } from './dto/checkout-preview-items.dto';
import { PaginatedSalesOrders } from './persistence/base-sales-order.repository';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ReturnRequestsService } from '@/return-requests/return-requests.service';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import { CreateReturnRequestDto } from '@/return-requests/dto';

/**
 * Sales Orders Controller
 * Handles checkout and order management endpoints
 */
@ApiTags('Sales Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'sales-orders',
  version: '1',
})
export class SalesOrdersController {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly returnRequestsService: ReturnRequestsService,
  ) {}

  /**
   * GET /sales-orders/checkout/preview
   * Get checkout preview - validates cart and shows what will be ordered
   */
  @Get('checkout/preview')
  @ApiOperation({
    summary: 'Checkout preview',
    description:
      'Get a preview of the checkout. Shows all cart items with availability status, totals (including shipping), and whether checkout can proceed. Optionally provide address_id for shipping calculation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout preview',
    type: CheckoutPreview,
  })
  async getCheckoutPreview(
    @CurrentUser() user: User,
    @Query() query: CheckoutPreviewQueryDto,
  ): Promise<CheckoutPreview> {
    if (query.vouchers?.length && query.voucher_code) {
      throw new BadRequestException(
        'Cannot use both vouchers and voucher_code. Provide only one.',
      );
    }
    return this.salesOrdersService.getCheckoutPreview(
      user,
      query.address_id,
      query.shipping_method_id,
      query.vouchers,
      query.voucher_code,
      query.fulfillment_type,
    );
  }

  /**
   * POST /sales-orders/checkout/preview
   * Get checkout preview with items payload - bypasses cart
   */
  @Post('checkout/preview')
  @ApiOperation({
    summary: 'Checkout preview with items',
    description:
      'Get a preview of the checkout using provided items instead of cart. Shows items with availability status, totals (including shipping), and whether checkout can proceed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout preview',
    type: CheckoutPreview,
  })
  async getCheckoutPreviewWithItems(
    @CurrentUser() user: User,
    @Body() input: CheckoutPreviewItemsDto,
  ): Promise<CheckoutPreview> {
    if (input.vouchers?.length && input.voucher_code) {
      throw new BadRequestException(
        'Cannot use both vouchers and voucher_code. Provide only one.',
      );
    }
    return this.salesOrdersService.getCheckoutPreviewWithItems(
      user,
      input.items,
      input.address_id,
      input.shipping_method_id,
      input.vouchers,
      input.voucher_code,
    );
  }

  /**
   * POST /sales-orders
   * Place order - Convert shopping cart to a sales order
   */
  @Post()
  @ApiOperation({
    summary: 'Place order',
    description:
      'Place an order from the shopping cart. Validates items, creates order(s), reserves stock, and clears cart. Creates SEPARATE orders for items from different sellers. Call checkout/preview first to see what will be ordered.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Order(s) created successfully. Returns multiple orders if cart has items from different sellers.',
    type: PlaceOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cart is empty' })
  @ApiResponse({
    status: 422,
    description: 'Item validation failed (out of stock, unavailable)',
  })
  async placeOrder(
    @Body() input: PlaceOrderDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<PlaceOrderResponseDto> {
    // Extract client IP for DragonPay payment gateway (required for V2 API).
    // Prefer x-forwarded-for (set by reverse proxies) over socket address.
    if (!input.ip_address) {
      const forwarded = req.headers['x-forwarded-for'];
      input.ip_address =
        (typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : null) ||
        req.socket?.remoteAddress ||
        undefined;
    }
    return this.salesOrdersService.placeOrder(input, user);
  }

  /**
   * GET /sales-orders/my-orders
   * Get current user's orders with pagination
   */
  @Get('my-orders')
  @ApiOperation({
    summary: 'Get my orders',
    description: "Get current user's orders with pagination",
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
  })
  async findMyOrders(
    @Query() query: QuerySalesOrderDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedSalesOrders> {
    return this.salesOrdersService.findByUserId(user.id, query);
  }

  /**
   * GET /sales-orders/:id/payment-status
   * Lightweight endpoint for polling payment status (mobile app)
   */
  @Get(':id/payment-status')
  @ApiOperation({
    summary: 'Get payment status',
    description:
      'Lightweight endpoint that returns only the payment status for an order. Designed for mobile polling after online payment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ payment_status: string; order_number: string }> {
    return this.salesOrdersService.getPaymentStatus(id, user);
  }

  /**
   * PATCH /sales-orders/:id/payment-method
   * Switch or retry payment method for an order awaiting or failed payment.
   * Allows the customer to change from non-COD to COD (or a different gateway)
   * without losing the order.
   */
  @Patch(':id/payment-method')
  @ApiOperation({
    summary: 'Switch payment method',
    description:
      'Change the payment method for an order that is awaiting payment or has a failed payment. ' +
      'Cancels the previous payment attempt and initiates a new one. ' +
      'Supports switching between COD and any non-COD method (gcash, maya, bpi, etc.).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Payment method switched. Returns checkout_url for non-COD methods.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order payment status does not allow retry',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async switchPaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: SwitchPaymentMethodDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<{
    checkout_url: string | null;
    payment_transaction_number: string | null;
  }> {
    if (!input.ip_address) {
      const forwarded = req.headers['x-forwarded-for'];
      input.ip_address =
        (typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : null) ||
        req.socket?.remoteAddress ||
        undefined;
    }
    return this.salesOrdersService.switchPaymentMethod(id, input, user);
  }

  /**
   * GET /sales-orders/:id
   * Get order by ID (current user only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description:
      'Get order details for current user. Only the order owner can access their own orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: SalesOrder,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.findById(id, user);
  }

  // NOTE: Order tracking endpoint moved to OrderTrackingController
  // GET /sales-orders/:id/tracking -> order-tracking.controller.ts

  /**
   * PATCH /sales-orders/:id/cancel
   * Cancel an order (owner or admin only)
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel order',
    description:
      'Cancel an order. Only pending/confirmed orders can be cancelled. Releases reserved stock.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CancelOrderDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.cancelOrder(id, input, user);
  }

  /**
   * PATCH /sales-orders/:id/complete
   * Complete an order (buyer confirms receipt)
   */
  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete order',
    description:
      'Mark an order as completed. Only the order owner can complete their delivered orders. This confirms receipt and allows leaving reviews.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order completed',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be completed (not in delivered status)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async completeOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.completeOrder(id, user);
  }

  /**
   * PATCH /sales-orders/:id/return
   * Request partial return for a delivered/completed order
   */
  @Patch(':id/return')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 return requests per minute per user
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB per file (video support)
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/quicktime',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV) are allowed.`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Request partial return',
    description:
      'Request a return for specific items from a delivered or completed order. Specify which items and quantities to return. ' +
      'Upload photos as evidence via multipart files OR base64_files in JSON (optional, max 5 images total, max 5MB each). ' +
      'Both methods can be combined. Only the order owner can request returns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return request created',
    type: ReturnRequest,
  })
  @ApiResponse({
    status: 400,
    description:
      'Order cannot be returned (not in delivered/completed status) or invalid items',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async returnOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true }))
    input: CreateReturnRequestDto,
    @CurrentUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ReturnRequest> {
    return this.returnRequestsService.createReturnRequest(
      id,
      input,
      user,
      files,
    );
  }

  /**
   * GET /sales-orders/:id/return
   * Get return request for an order
   */
  @Get(':id/return')
  @ApiOperation({
    summary: 'Get return request',
    description: 'Get the return request details for an order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return request details',
    type: ReturnRequest,
  })
  @ApiResponse({ status: 403, description: 'Access denied - not your order' })
  @ApiResponse({ status: 404, description: 'No return request found' })
  async getReturnRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ReturnRequest | null> {
    return this.returnRequestsService.getReturnRequestByOrderIdForUser(
      id,
      user.id,
    );
  }

  /**
   * PATCH /sales-orders/:id/pickup-status
   * Update pickup order status (seller/admin only)
   * Transitions: processing → ready_for_pickup → completed
   */
  @Patch(':id/pickup-status')
  @ApiOperation({
    summary: 'Update pickup status',
    description:
      'Advance a pickup order through its lifecycle. Allowed transitions: processing → ready_for_pickup → completed. Seller or admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pickup status updated',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition or not a pickup order',
  })
  @ApiResponse({ status: 403, description: 'Seller or admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updatePickupStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdatePickupStatusDto,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.updatePickupStatus(
      id,
      input.status_notes,
      user,
    );
  }

  /**
   * PATCH /sales-orders/:id/pickup-no-show
   * Mark a pickup order as no-show (seller/admin only)
   * Transition: ready_for_pickup → cancelled
   */
  @Patch(':id/pickup-no-show')
  @ApiOperation({
    summary: 'Mark pickup as no-show',
    description:
      'Cancel a pickup order because the customer did not arrive. Order must be in ready_for_pickup status. Releases reserved stock. Seller or admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled as no-show',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Order not in ready_for_pickup status or not a pickup order',
  })
  @ApiResponse({ status: 403, description: 'Seller or admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async markPickupNoShow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.markPickupNoShow(id, user);
  }

  /**
   * PATCH /sales-orders/:id/pickup-grace-period
   * Extend the grace period for a pickup order (seller/admin only)
   */
  @Patch(':id/pickup-grace-period')
  @ApiOperation({
    summary: 'Extend pickup grace period',
    description:
      'Give a late customer more time before marking their pickup order as no-show. Order must be in ready_for_pickup status. Extension must be 1–480 minutes. Seller or admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grace period extended',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description:
      'Order not in ready_for_pickup status, not a pickup order, or invalid extension value',
  })
  @ApiResponse({ status: 403, description: 'Seller or admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async extendPickupGracePeriod(
    @Param('id', ParseIntPipe) id: number,
    @Body('extension_minutes', ParseIntPipe) extensionMinutes: number,
    @CurrentUser() user: User,
  ): Promise<SalesOrder> {
    return this.salesOrdersService.extendPickupGracePeriod(
      id,
      extensionMinutes,
      user,
    );
  }
}
