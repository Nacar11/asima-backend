import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { QuotationCheckoutService } from './quotation-checkout.service';
import { QuotationCheckoutPreviewResponseDto } from './dto/quotation-checkout-preview.dto';
import {
  ProcessQuotationCheckoutDto,
  QuotationCheckoutResultDto,
} from './dto/process-quotation-checkout.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Quotation Checkout Controller.
 *
 * Handles direct checkout from accepted quotations, bypassing the cart.
 * Creates SalesOrder, manages bookings, and processes payment.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Quotation Checkout')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'quotations',
  version: '1',
})
export class QuotationCheckoutController {
  constructor(
    private readonly quotationCheckoutService: QuotationCheckoutService,
  ) {}

  /**
   * GET /quotations/:id/checkout/preview
   * Get checkout preview for a quotation
   */
  @Get(':id/checkout/preview')
  @ApiOperation({
    summary: 'Get quotation checkout preview',
    description:
      'Preview what will be created when checking out from this quotation. Shows all items, existing bookings (for preventive flow), and pricing summary.',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({
    status: 200,
    description: 'Checkout preview',
    type: QuotationCheckoutPreviewResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Not the customer of this quotation',
  })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async getCheckoutPreview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<QuotationCheckoutPreviewResponseDto> {
    return this.quotationCheckoutService.getCheckoutPreview(id, user);
  }

  /**
   * POST /quotations/:id/checkout
   * Process quotation checkout
   */
  @Post(':id/checkout')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Process quotation checkout',
    description:
      'Accept the quotation and process checkout. Creates SalesOrder, creates/updates bookings, and processes payment. For preventive flow, updates existing bookings from AWAITING_QUOTATION to CONFIRMED. For reactive flow, creates new bookings.',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({
    status: 201,
    description: 'Checkout successful',
    type: QuotationCheckoutResultDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot checkout - quotation expired, wrong status, or validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the customer of this quotation',
  })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async processCheckout(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ProcessQuotationCheckoutDto,
    @CurrentUser() user: User,
  ): Promise<QuotationCheckoutResultDto> {
    return this.quotationCheckoutService.processCheckout(id, input, user);
  }
}
