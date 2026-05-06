import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ShoppingCartsService } from './shopping-carts.service';
import { ShoppingCart } from './domain/shopping-cart';
import { ShoppingCartItem } from './domain/shopping-cart-item';
import { CartSummary } from './domain/cart-summary';
import { AddCartItemResponse } from './domain/add-cart-item-response';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AddServiceToCartDto } from './dto/add-service-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartPaginationDto } from './dto/cart-pagination.dto';
import { BulkUpdateCartItemsDto } from './dto/bulk-update-cart-items.dto';
import { BulkDeleteCartItemsDto } from './dto/bulk-delete-cart-items.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Shopping cart controller following PRD Section 5.5 API specifications.
 *
 * Implements the following PRD-compliant endpoints:
 * - GET /api/shopping-carts/:cartId - Fetch cart with pagination
 * - POST /api/shopping-carts/:cartId/items - Add item to cart
 * - PATCH /api/shopping-carts/:cartId/items/:itemId - Update item quantity
 * - DELETE /api/shopping-carts/:cartId/items/:itemId - Remove item
 * - GET /api/shopping-carts/:cartId/summary - Get cart summary
 *
 * All endpoints require JWT authentication.
 * Rate limiting applied per PRD Section 5.5.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Shopping Carts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'shopping-carts', version: '1' })
export class ShoppingCartsController {
  constructor(private readonly service: ShoppingCartsService) {}

  /**
   * GET /api/shopping-carts/my-cart
   *
   * Convenience endpoint for cart discovery.
   * Returns the authenticated user's cart (auto-creates if doesn't exist).
   *
   * NOT in PRD specification, but necessary for users to discover their cart ID
   * so they can use the PRD-compliant endpoints (POST /:cartId/items, etc.).
   *
   * Frontend workflow:
   * 1. Call GET /my-cart to get cart object with id
   * 2. Use cart.id in PRD endpoints: POST /:cartId/items, PATCH /:cartId/items/:itemId, etc.
   */
  @Get('my-cart')
  @ApiOperation({
    summary: 'Get my shopping cart',
    description:
      "Convenience endpoint to get the authenticated user's cart with auto-creation. Returns cart with id for use in other endpoints.",
  })
  @ApiResponse({
    status: 200,
    description: 'Shopping cart retrieved successfully',
    type: ShoppingCart,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async getMyCart(@CurrentUser() user: User): Promise<ShoppingCart> {
    return this.service.getMyCart(user);
  }

  /**
   * GET /api/shopping-carts/:cartId/summary
   *
   * Fetch cart summary (item count, subtotal, totals).
   * Used for real-time summary updates without fetching full cart.
   *
   * PRD Section 5.5, Line 369-374:
   * - Response includes: item_count, subtotal, tax_amount, shipping_amount, total_amount
   * - Used for real-time summary updates without fetching full cart
   * - Error responses: 401, 403, 404, 500
   * - No rate limiting for summary endpoint (high-frequency updates allowed)
   */
  @Get(':cartId/summary')
  @ApiOperation({
    summary: 'Get cart summary by cart ID',
    description:
      'Fetch lightweight cart summary for a specific cart with item count and totals. Used for real-time cart badge updates. No rate limiting applied for high-frequency updates. Users can only access their own cart.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cart summary retrieved successfully',
    type: CartSummary,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot access another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCartSummary(
    @Param('cartId', ParseIntPipe) cartId: number,
    @CurrentUser() user: User,
  ): Promise<CartSummary> {
    return await this.service.getCartSummary(cartId, user);
  }

  /**
   * GET /api/shopping-carts/:cartId
   *
   * Fetch shopping cart with all items, product details, and pricing.
   * Supports pagination for carts with >100 items (PRD Section 5.1, Line 310).
   *
   * PRD Section 5.5, Line 341-346:
   * - Query parameters: page (optional, default 1), limit (optional, default 20, max 100)
   * - Response includes: cart ID, user ID, items array (paginated), subtotal, item count, timestamps
   * - Requires user authentication and ownership validation
   * - Error responses: 400, 401, 403, 404, 500
   */
  @Get(':cartId')
  @ApiOperation({
    summary: 'Get shopping cart by ID',
    description:
      'Fetch shopping cart with all items, product details, and pricing. Supports pagination for large carts (>100 items). Users can only access their own cart.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: ShoppingCart,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid cart ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot access another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCartById(
    @Param('cartId', ParseIntPipe) cartId: number,
    @CurrentUser() user: User,
    @Query() paginationDto?: CartPaginationDto,
  ): Promise<ShoppingCart> {
    // PRD specifies pagination support for >100 items
    // Default: page=1, limit=20, max=100
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 20;

    return this.service.getCartByIdWithPagination(cartId, user, {
      page,
      limit,
    });
  }

  /**
   * POST /api/shopping-carts/:cartId/items
   *
   * Add item to shopping cart.
   * Validates quantity against available stock and product minimum_order.
   *
   * PRD Section 5.5, Line 348-354:
   * - Request body: { variant_id, quantity }
   * - Response includes: cart summary, affected item, and store info
   * - Validates quantity against available stock and product minimum_order
   * - Error responses: 400, 401, 403, 409, 500
   * - Rate limit: 10 requests per minute per user
   */
  @Post(':cartId/items')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per PRD
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'Add product variant to shopping cart with specified quantity. Validates stock availability and minimum order requirements. If variant already exists, quantity is incremented. Rate limited to 10 requests/min.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item added successfully',
    type: AddCartItemResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid variant ID or quantity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Stock unavailable or insufficient',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async addItem(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() input: AddCartItemDto,
    @CurrentUser() user: User,
  ): Promise<AddCartItemResponse> {
    return this.service.addItem(cartId, input, user);
  }

  /**
   * POST /api/shopping-carts/:cartId/items/service
   *
   * Add service item to shopping cart.
   * Validates service availability and scheduling before adding.
   *
   * - Request body: { service_id, package_id (optional), scheduled_date, scheduled_start_time, quantity }
   * - Response includes: updated cart with new service item
   * - Validates service status, package validity, and scheduling
   * - Error responses: 400, 401, 403, 404, 422, 500
   * - Rate limit: 10 requests per minute per user
   */
  @Post(':cartId/items/service')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add service item to cart',
    description:
      'Add service booking to shopping cart with specified scheduling. Validates service availability and package validity. If same service with same scheduling already exists, quantity is incremented. Rate limited to 10 requests/min.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Service item added successfully',
    type: ShoppingCart,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid service ID, package ID, or scheduling',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart, service, or package not found',
  })
  @ApiResponse({
    status: 422,
    description:
      'Unprocessable entity - Service not available or business rules violated',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async addServiceItem(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() input: AddServiceToCartDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingCart> {
    return this.service.addServiceItem(cartId, input, user);
  }

  /**
   * PATCH /api/shopping-carts/:cartId/items/bulk-update
   *
   * Bulk update is_selected status for multiple cart items.
   * Updates the selection status of specified items in a single operation.
   *
   * NOTE: This route MUST be defined before :cartId/items/:itemId
   * to prevent 'bulk-update' from being matched as an itemId.
   */
  @Patch(':cartId/items/bulk-update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Bulk update cart items selection',
    description:
      'Update the is_selected status for multiple cart items at once. Rate limited to 20 requests/min.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Cart items updated successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid item IDs or items do not belong to cart',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async bulkUpdateItems(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() input: BulkUpdateCartItemsDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.service.bulkUpdateItems(cartId, input, user);
  }

  /**
   * PATCH /api/shopping-carts/:cartId/items/:itemId
   *
   * Update cart item (quantity and/or selection status).
   * Validates quantity against available stock and product minimum_order.
   *
   * PRD Section 5.5, Line 361-367:
   * - Request body: { quantity?, is_selected? }
   * - Response includes: updated cart with modified item, success message
   * - Validates quantity against available stock and product minimum_order
   * - Error responses: 400, 401, 403, 404, 409, 500
   * - Rate limit: 20 requests per minute per user
   */
  @Patch(':cartId/items/:itemId')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute per PRD
  @ApiOperation({
    summary: 'Update cart item',
    description:
      'Update cart item quantity and/or selection status. Set is_selected to true/false to include/exclude item from checkout. Validates stock availability and minimum order requirements. Rate limited to 20 requests/min.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiParam({
    name: 'itemId',
    type: Number,
    description: 'Cart item ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
    type: ShoppingCartItem,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid quantity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart or item does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Stock unavailable or insufficient',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateItemQuantity(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() input: UpdateCartItemDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingCartItem> {
    return this.service.updateItemQuantity(itemId, input, user);
  }

  /**
   * DELETE /api/shopping-carts/:cartId/items/bulk-delete
   *
   * Bulk delete multiple cart items.
   * Soft deletes specified items in a single operation.
   *
   * NOTE: This route MUST be defined before :cartId/items/:itemId
   * to prevent 'bulk-delete' from being matched as an itemId.
   */
  @Delete(':cartId/items/bulk-delete')
  @ApiOperation({
    summary: 'Bulk delete cart items',
    description:
      'Remove multiple items from the shopping cart at once. Items are soft-deleted for audit trail. Maximum 100 items per request.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cart items deleted successfully',
    type: ShoppingCart,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid item IDs or items do not belong to cart',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async bulkDeleteItems(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() input: BulkDeleteCartItemsDto,
    @CurrentUser() user: User,
  ): Promise<ShoppingCart> {
    return this.service.bulkDeleteItems(cartId, input, user);
  }

  /**
   * DELETE /api/shopping-carts/:cartId/items/:itemId
   *
   * Remove item from shopping cart.
   *
   * PRD Section 5.5, Line 356-359:
   * - Response: 204 No Content
   * - Error responses: 400, 401, 403, 404, 409, 500
   */
  @Delete(':cartId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove item from cart',
    description:
      'Remove item completely from shopping cart. Item is soft-deleted for audit trail. Returns no response body.',
  })
  @ApiParam({
    name: 'cartId',
    type: Number,
    description: 'Shopping cart ID',
    example: 1,
  })
  @ApiParam({
    name: 'itemId',
    type: Number,
    description: 'Cart item ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Item removed successfully - no response body',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid item ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot modify another user's cart",
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Cart or item does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Concurrent removal detected',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async removeItem(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.service.removeItem(itemId, user);
  }
}
