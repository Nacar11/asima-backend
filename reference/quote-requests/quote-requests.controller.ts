import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { QuoteRequestsService } from './quote-requests.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import {
  RespondQuoteRequestDto,
  CustomerRespondQuoteDto,
} from './dto/respond-quote-request.dto';
import { QuoteRequest, QuoteRequestStatusEnum } from './domain/quote-request';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { SellersService } from '@/sellers/sellers.service';
import { CreateQuotationItemDto } from '@/quotation-items/dto/create-quotation-item.dto';

/**
 * Quote Requests Controller.
 *
 * Handles endpoints for quote requests workflow.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Quote Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'quote-requests',
  version: '1',
})
export class QuoteRequestsController {
  constructor(
    private readonly quoteRequestsService: QuoteRequestsService,
    private readonly sellersService: SellersService,
  ) {}

  // ==================== Customer Endpoints ====================

  /**
   * POST /quote-requests
   * Create a new quote request
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create quote request',
    description:
      'Customer requests a custom quote for a service that requires quoting.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote request created successfully',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or service error' })
  async create(
    @Body() input: CreateQuoteRequestDto,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.create(input, user);
  }

  /**
   * GET /quote-requests/my
   * Get current user's quote requests (as customer)
   */
  @Get('my')
  @ApiOperation({
    summary: 'Get my quote requests',
    description: 'Get quote requests for the current user (customer view).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: QuoteRequestStatusEnum })
  @ApiResponse({
    status: 200,
    description: 'List of quote requests',
  })
  async findMy(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: QuoteRequestStatusEnum,
  ): Promise<{ data: QuoteRequest[]; totalCount: number }> {
    return this.quoteRequestsService.findByCustomerId(user.id, {
      page,
      limit,
      status,
    });
  }

  // ==================== Seller Endpoints ====================

  /**
   * GET /quote-requests/seller
   * Get quote requests for seller's services
   */
  @Get('seller/list')
  @ApiOperation({
    summary: 'Get seller quote requests',
    description:
      'Get quote requests for services owned by the current user as seller.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: QuoteRequestStatusEnum })
  @ApiResponse({
    status: 200,
    description: 'List of quote requests for seller',
  })
  async findForSeller(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: QuoteRequestStatusEnum,
  ): Promise<{ data: QuoteRequest[]; totalCount: number }> {
    // Get seller for current user
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller) {
      throw new NotFoundException('Seller profile not found for current user');
    }

    return this.quoteRequestsService.findBySellerId(seller.id, {
      page,
      limit,
      status,
    });
  }

  // ==================== Booking-Quotation Lookup Endpoints ====================

  /**
   * GET /quote-requests/by-booking/:bookingId
   * Get all quotations linked to a booking
   */
  @Get('by-booking/:bookingId')
  @ApiOperation({
    summary: 'Get quotations by booking',
    description:
      'Returns all quotations linked to a booking (via assessment_booking_id, quotation_id, or source_quotation_id). Includes revision history.',
  })
  @ApiParam({ name: 'bookingId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of quotations linked to the booking',
    type: [QuoteRequest],
  })
  async findByBookingId(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<QuoteRequest[]> {
    return this.quoteRequestsService.findByBookingId(bookingId);
  }

  // ==================== Parameterized :id Endpoints ====================

  /**
   * GET /quote-requests/:id
   * Get quote request by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get quote request by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quote request details',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 404, description: 'Quote request not found' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<QuoteRequest> {
    return this.quoteRequestsService.findById(id);
  }

  /**
   * GET /quote-requests/:id/revision-history
   * Get revision history for a quotation
   */
  @Get(':id/revision-history')
  @ApiOperation({
    summary: 'Get quotation revision history',
    description:
      'Returns all quotations in the revision chain (original and all revisions).',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Revision history',
    type: [QuoteRequest],
  })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async getRevisionHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuoteRequest[]> {
    return this.quoteRequestsService.getRevisionHistory(id);
  }

  // ==================== Customer Response Endpoints ====================

  /**
   * PATCH /quote-requests/:id/respond
   * Customer responds to a quote (accept/reject)
   */
  @Patch(':id/respond')
  @ApiOperation({
    summary: 'Respond to quote',
    description: 'Customer accepts or rejects a quote.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quote response recorded',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid status or expired quote' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async customerRespond(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CustomerRespondQuoteDto,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.customerRespond(id, input, user);
  }

  /**
   * PATCH /quote-requests/:id/cancel
   * Cancel a quote request
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel quote request',
    description: 'Customer cancels a pending quote request.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quote request cancelled',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel this quote' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.cancel(id, user);
  }

  /**
   * PATCH /quote-requests/:id/quote
   * Seller submits a quote
   */
  @Patch(':id/quote')
  @ApiOperation({
    summary: 'Submit quote',
    description: 'Seller submits pricing for a quote request.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quote submitted successfully',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async sellerRespond(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: RespondQuoteRequestDto,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.sellerRespond(id, input, user);
  }

  // ==================== DPO Quotation Endpoints ====================

  /**
   * POST /quote-requests/post-assessment
   * Create a post-assessment quotation (optionally with services and materials in the same request).
   */
  @Post('post-assessment')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create post-assessment quotation',
    description:
      'Seller creates a quotation after completing an assessment booking. Optionally include "items" (services and materials) in the body to create the quotation and add line items in one request. Otherwise add items later via POST /quotation-items.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quotation created',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Not an assessment booking' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async createPostAssessmentQuotation(
    @Body()
    input: {
      assessment_booking_id: number;
      seller_response?: string;
      estimated_duration_minutes?: number;
      quote_expires_days?: number;
      preferred_date?: string; // date of service for the quotation (YYYY-MM-DD)
      items?: CreateQuotationItemDto[];
    },
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.createPostAssessmentQuotation(input, user);
  }

  /**
   * PATCH /quote-requests/:id/send
   * Send quotation to customer (updates status to QUOTED and notifies customer)
   */
  @Patch(':id/send')
  @ApiOperation({
    summary: 'Send quotation',
    description: 'Updates status to QUOTED and notifies customer.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quotation sent',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async sendQuotation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.sendQuotation(id, user);
  }

  /**
   * POST /quote-requests/:id/revision
   * Create a revision of existing quotation
   */
  @Post(':id/revision')
  @ApiOperation({
    summary: 'Create quotation revision',
    description:
      'Creates a new quotation as a revision of the specified one. Cancels the parent quotation.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Revision created',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async createRevision(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.createRevision(id, user);
  }

  /**
   * POST /quote-requests/:id/accept
   * Customer accepts a quotation
   */
  @Post(':id/accept')
  @ApiOperation({
    summary: 'Accept quotation',
    description:
      'Customer accepts a quotation. Creates bookings from service items in the quotation.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quotation accepted, bookings created',
    type: QuoteRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid status or expired' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async acceptQuotation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.acceptQuotation(id, user);
  }
}
