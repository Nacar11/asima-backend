import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CheckoutOrdersService } from './checkout-orders.service';
import { CheckoutOrder } from './domain/checkout-order';
import { CreateCheckoutOrderDto } from './dto/create-checkout-order.dto';
import { UpdateCheckoutOrderDto } from './dto/update-checkout-order.dto';
import { QueryCheckoutOrderDto } from './dto/query-checkout-order.dto';
import { ConfirmCheckoutOrderDto } from './dto/confirm-checkout-order.dto';
import { CancelCheckoutOrderDto } from './dto/cancel-checkout-order.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Throttle } from '@nestjs/throttler';

/**
 * Checkout Orders Controller.
 *
 * Handles endpoints for unified checkout orders that can contain
 * both products and services.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Checkout Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'checkout-orders',
  version: '1',
})
export class CheckoutOrdersController {
  constructor(private readonly checkoutOrdersService: CheckoutOrdersService) {}

  /**
   * POST /checkout-orders
   * Create checkout order from shopping cart
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create checkout order',
    description:
      'Create a checkout order from the shopping cart. Handles both product and service items. Validates items, calculates totals, and generates order number.',
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout order created successfully',
    type: CheckoutOrder,
  })
  @ApiResponse({ status: 400, description: 'Cart is empty or invalid' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async create(
    @Body() input: CreateCheckoutOrderDto,
    @CurrentUser() user: User,
  ): Promise<CheckoutOrder> {
    return this.checkoutOrdersService.createFromCart(input, user);
  }

  /**
   * GET /checkout-orders/my-orders
   * Get current user's checkout orders with pagination
   */
  @Get('my-orders')
  @ApiOperation({
    summary: 'Get my checkout orders',
    description: "Get current user's checkout orders with pagination",
  })
  @ApiResponse({
    status: 200,
    description: 'List of checkout orders',
  })
  async findMyOrders(
    @Query() query: QueryCheckoutOrderDto,
    @CurrentUser() user: User,
  ): Promise<IPaginatedResult<CheckoutOrder>> {
    return this.checkoutOrdersService.findByUserId(user, query);
  }

  /**
   * GET /checkout-orders
   * Get all checkout orders (admin only)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all checkout orders',
    description: 'Get all checkout orders with pagination (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of checkout orders',
  })
  async findAll(
    @Query() query: QueryCheckoutOrderDto,
  ): Promise<IPaginatedResult<CheckoutOrder>> {
    return this.checkoutOrdersService.findAll(query);
  }

  /**
   * GET /checkout-orders/:id
   * Get checkout order by ID (current user only)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get checkout order by ID',
    description:
      'Get checkout order details for current user. Only the order owner can access their own orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout order details',
    type: CheckoutOrder,
  })
  @ApiResponse({ status: 404, description: 'Checkout order not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<CheckoutOrder> {
    return this.checkoutOrdersService.findById(id, user);
  }

  /**
   * PATCH /checkout-orders/:id
   * Update checkout order
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update checkout order',
    description:
      'Update checkout order status, payment status, addresses, or notes. Only the order owner can update their own orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout order updated',
    type: CheckoutOrder,
  })
  @ApiResponse({ status: 404, description: 'Checkout order not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateCheckoutOrderDto,
    @CurrentUser() user: User,
  ): Promise<CheckoutOrder> {
    return this.checkoutOrdersService.update(id, input, user);
  }

  /**
   * POST /checkout-orders/:id/confirm
   * Confirm a checkout order
   */
  @Post(':id/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Confirm checkout order',
    description:
      'Confirm a pending checkout order. Can optionally specify payment method to initiate payment processing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout order confirmed',
    type: CheckoutOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be confirmed' })
  @ApiResponse({ status: 404, description: 'Checkout order not found' })
  async confirmOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ConfirmCheckoutOrderDto,
    @CurrentUser() user: User,
  ): Promise<CheckoutOrder> {
    return this.checkoutOrdersService.confirmOrder(id, input, user);
  }

  /**
   * POST /checkout-orders/:id/cancel
   * Cancel a checkout order
   */
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel checkout order',
    description:
      'Cancel a checkout order with a required cancellation reason. Cannot cancel completed or already cancelled orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout order cancelled',
    type: CheckoutOrder,
  })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Checkout order not found' })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CancelCheckoutOrderDto,
    @CurrentUser() user: User,
  ): Promise<CheckoutOrder> {
    return this.checkoutOrdersService.cancelOrder(id, input, user);
  }
}
