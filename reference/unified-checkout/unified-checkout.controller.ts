import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UnifiedCheckoutService } from './unified-checkout.service';
import { ProcessUnifiedCheckoutDto } from './dto/process-unified-checkout.dto';
import { UnifiedCheckoutPreviewDto } from './dto/unified-checkout-preview.dto';
import { UnifiedCheckoutPreview } from './domain/unified-checkout-preview';
import { UnifiedCheckoutResult } from './domain/unified-checkout-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Unified Checkout Controller.
 *
 * Handles unified checkout operations for carts containing
 * both products and services.
 *
 * @version 1
 */
@ApiTags('Unified Checkout')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'unified-checkout',
  version: '1',
})
export class UnifiedCheckoutController {
  constructor(
    private readonly unifiedCheckoutService: UnifiedCheckoutService,
  ) {}

  /**
   * Get unified checkout preview.
   *
   * Returns a preview of all selected cart items (products and services)
   * with pricing, availability validation, and combined totals.
   */
  @Get('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get unified checkout preview (products + services)',
    description:
      'Returns a preview of selected cart items with product and service details, availability validation, and combined pricing summary.',
  })
  @ApiOkResponse({
    type: UnifiedCheckoutPreview,
    description: 'Checkout preview with items and summary',
  })
  @ApiBadRequestResponse({
    description: 'No items selected for checkout',
  })
  async getPreview(
    @CurrentUser() user: User,
    @Query() query: UnifiedCheckoutPreviewDto,
  ): Promise<UnifiedCheckoutPreview> {
    return this.unifiedCheckoutService.getUnifiedPreview(user, query);
  }

  /**
   * Process unified checkout.
   *
   * Creates checkout order, then:
   * - Sales order for products (if any)
   * - Booking(s) for services (if any)
   *
   * All operations are performed atomically.
   */
  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process unified checkout for products and services',
    description:
      'Creates a checkout order and processes products (creating sales order) and services (creating bookings) in a single operation.',
  })
  @ApiCreatedResponse({
    type: UnifiedCheckoutResult,
    description: 'Checkout processed successfully with order details',
  })
  @ApiBadRequestResponse({
    description: 'Cannot checkout - items unavailable or validation failed',
  })
  async processCheckout(
    @CurrentUser() user: User,
    @Body() input: ProcessUnifiedCheckoutDto,
  ): Promise<UnifiedCheckoutResult> {
    return this.unifiedCheckoutService.processUnifiedCheckout(input, user);
  }
}
