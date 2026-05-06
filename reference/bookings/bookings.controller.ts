import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { Booking } from './domain/booking';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CalendarMonthDto } from './dto/calendar-month.dto';
import { DayScheduleDto } from './dto/day-schedule.dto';
import { DeclineBookingDto } from './dto/decline-booking.dto';
import { UpdateProviderNotesDto } from './dto/update-provider-notes.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CustomerApproveBookingDto } from './dto/customer-approve-booking.dto';
import { RequestRescheduleDto } from './dto/request-reschedule.dto';
import { ExportBookingsDto, ExportFormatEnum } from './dto/export-bookings.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Throttle } from '@nestjs/throttler';
import { BookingCancellationsService } from '@/booking-cancellations/booking-cancellations.service';
import { CreateBookingCancellationDto } from '@/booking-cancellations/dto/create-booking-cancellation.dto';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { CalendarDay } from './domain/calendar-day';
import { DayScheduleItem } from './domain/day-schedule-item';
import { AdminForceCancelDto } from './dto/admin-force-cancel.dto';
import { AdminRefundDto } from './dto/admin-refund.dto';
import { BulkDeleteBookingsDto } from './dto/bulk-delete-bookings.dto';
import { CreatePreventiveBookingRequestDto } from './dto/create-preventive-booking-request.dto';

/**
 * Bookings Controller.
 *
 * Handles endpoints for service bookings created from checkout orders.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'bookings',
  version: '1',
})
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly bookingCancellationsService: BookingCancellationsService,
  ) {}

  /**
   * POST /bookings
   * Create booking from checkout order
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create booking',
    description:
      'Create a booking from a checkout order that contains service items. Validates service, seller, and calculates pricing.',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async create(
    @Body() input: CreateBookingDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.createFromCheckout(input, user);
  }

  /**
   * POST /bookings/request-quote
   * Request a booking for a service that requires a quote (preventive flow)
   */
  @Post('request-quote')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Request booking quote (Preventive Flow)',
    description:
      'Create a booking request for a service that requires a quote. Creates a booking with status AWAITING_QUOTATION and stores form submission values. No payment is required at this stage.',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking request created successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Service does not require quote or validation failed',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async requestQuote(
    @Body() input: CreatePreventiveBookingRequestDto,
    @CurrentUser() user: User,
  ): Promise<Booking | Booking[]> {
    return this.bookingsService.createPreventiveRequest(input, user);
  }

  /**
   * GET /bookings/my-bookings
   * Get current user's bookings (as customer)
   */
  @Get('my-bookings')
  @ApiOperation({
    summary: 'Get my bookings',
    description: "Get current user's bookings as a customer with pagination",
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
  })
  async findMyBookings(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User,
  ): Promise<IPaginatedResult<Booking>> {
    return this.bookingsService.findByCustomerId(user, query);
  }

  /**
   * GET /bookings/my-bookings/counts
   * Get counts by status for the current customer (single API call)
   */
  @Get('my-bookings/counts')
  @ApiOperation({
    summary: 'Get customer booking counts by status',
    description:
      'Returns counts per status for the current customer; supports optional date range.',
  })
  @ApiResponse({ status: 200, description: 'Counts per status' })
  async getMyBookingCounts(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User,
  ): Promise<Record<string, number>> {
    return this.bookingsService.getStatusCountsForCustomer(user.id, query);
  }

  /**
   * GET /bookings/seller-bookings
   * Get current user's seller bookings
   */
  @Get('seller-bookings')
  @ApiOperation({
    summary: 'Get my seller bookings',
    description:
      "Get bookings for the current user's seller account with pagination",
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller profile not found for current user',
  })
  async findMySellerBookings(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User,
  ): Promise<IPaginatedResult<Booking>> {
    return await this.bookingsService.findMySellerBookings(user, query);
  }

  /**
   * GET /bookings/seller-bookings/counts
   * Get counts by status for the current seller (single API call)
   */
  @Get('seller-bookings/counts')
  @ApiOperation({
    summary: 'Get seller booking counts by status',
    description:
      'Returns counts per status for the current seller; supports optional date range.',
  })
  @ApiResponse({ status: 200, description: 'Counts per status' })
  async getMySellerBookingCounts(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User,
  ): Promise<Record<string, number>> {
    const seller = await this.bookingsService.findSellerForUser(user);
    return this.bookingsService.getStatusCountsForSeller(seller.id, query);
  }

  /**
   * GET /bookings/seller/:sellerId
   * Get bookings for a seller
   */
  @Get('seller/:sellerId')
  @ApiOperation({
    summary: 'Get seller bookings',
    description: 'Get bookings for a specific seller (seller access only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findSellerBookings(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User,
  ): Promise<IPaginatedResult<Booking>> {
    return this.bookingsService.findBySellerId(sellerId, user, query);
  }

  /**
   * GET /bookings/checkout-order/:checkoutOrderId
   * Get bookings for a checkout order
   */
  @Get('checkout-order/:checkoutOrderId')
  @ApiOperation({
    summary: 'Get bookings by checkout order',
    description: 'Get all bookings created from a specific checkout order',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
    type: [Booking],
  })
  async findByCheckoutOrder(
    @Param('checkoutOrderId', ParseIntPipe) checkoutOrderId: number,
    @CurrentUser() user: User,
  ): Promise<Booking[]> {
    return this.bookingsService.findByCheckoutOrderId(checkoutOrderId, user);
  }

  /**
   * GET /bookings
   * Get all bookings (admin only)
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Get all bookings (Admin)',
    description: 'Get all bookings with pagination (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
  })
  async findAll(
    @Query() query: QueryBookingDto,
  ): Promise<IPaginatedResult<Booking>> {
    return this.bookingsService.findAll(query);
  }

  /**
   * GET /bookings/number/:bookingNumber
   * Get booking by booking number
   */
  @Get('number/:bookingNumber')
  @ApiOperation({
    summary: 'Get booking by booking number',
    description:
      'Get booking details by human-readable booking number (e.g., BK-20250101-1234).',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findByBookingNumber(
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.findByBookingNumber(bookingNumber, user);
  }

  /**
   * GET /bookings/export
   * Export booking history
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export booking history',
    description:
      'Export booking history in CSV or JSON format with optional date range and status filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exported booking data',
  })
  async exportBookings(
    @Query() query: ExportBookingsDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.bookingsService.exportBookings(
      query.from,
      query.to,
      query.status,
      query.format || ExportFormatEnum.CSV,
      user,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('Content-Type', result.contentType);
    res.send(result.data);
  }

  /**
   * GET /bookings/:id
   * Get booking by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description:
      'Get booking details. Accessible by customer, seller, or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.findById(id, user);
  }

  /**
   * PATCH /bookings/:id
   * Update booking
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update booking',
    description:
      'Update booking details, scheduling, addresses, or notes. Accessible by customer, seller, or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBookingDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.update(id, input, user);
  }

  /**
   * PATCH /bookings/:id/assign-member
   * Assign a member to a booking
   */
  @Patch(':id/assign-member')
  @ApiOperation({
    summary: 'Assign member to booking',
    description:
      'Assign a seller member to handle the booking. Only accessible by seller.',
  })
  @ApiResponse({
    status: 200,
    description: 'Member assigned successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid member or validation failed',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async assignMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AssignMemberDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.assignMember(id, input, user);
  }

  /**
   * PATCH /bookings/:id/confirm
   * Confirm a booking
   */
  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'Confirm booking',
    description:
      'Confirm a pending booking. Transitions status to CONFIRMED. Only accessible by seller.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking confirmed',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Booking cannot be confirmed' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async confirmBooking(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.confirmBooking(id, user);
  }

  /**
   * PATCH /bookings/:id/start
   * Start service
   */
  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start service',
    description:
      'Start the service. Transitions status to IN_PROGRESS and records actual start time. Accessible by seller, assigned member, or system admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service started',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Service cannot be started' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async startService(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.startService(id, user);
  }

  /**
   * PATCH /bookings/:id/complete
   * Complete service
   */
  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete service',
    description:
      'Complete the service. Transitions status to COMPLETED and records actual end time. Only accessible by seller or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service completed',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Service cannot be completed' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeService(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.completeService(id, user);
  }

  /**
   * PATCH /bookings/:id/cancel
   * Cancel a booking
   *
   * Uses the cancellation service to handle refund calculations and policy enforcement.
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel booking',
    description:
      'Cancel a booking with refund calculation based on cancellation policy. Transitions status to CANCELLED and processes escrow refund. Accessible by customer or seller.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    // Use cancellation service for proper refund calculation
    const cancellationDto: CreateBookingCancellationDto = {
      reason: CancellationReasonEnum.CHANGED_MIND, // Default reason, can be enhanced to accept reason in DTO
      reason_details: input.notes || undefined,
    };
    await this.bookingCancellationsService.cancelBooking(
      id,
      cancellationDto,
      user,
    );
    // Return updated booking
    return this.bookingsService.findById(id, user);
  }

  /**
   * PATCH /bookings/:id/status
   * Update booking status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update booking status',
    description:
      'Update booking status with optional notes. Handles status transitions and timestamps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, input, user);
  }

  /**
   * PATCH /bookings/:id/reschedule
   * Reschedule a booking to a new date/time
   */
  @Patch(':id/reschedule')
  @ApiOperation({
    summary: 'Reschedule booking',
    description:
      'Reschedule a booking to a new date/time. Validates that the new date is in the future and the booking is in a reschedulable state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking rescheduled successfully',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Invalid reschedule request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async rescheduleBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: RescheduleBookingDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.rescheduleBooking(id, input, user);
  }

  /**
   * PATCH /bookings/:id/customer-approve
   * Customer approves a completed booking
   */
  @Patch(':id/customer-approve')
  @ApiOperation({
    summary: 'Customer approve booking',
    description:
      'Customer confirms satisfaction with the completed service. This triggers escrow release to the provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking approved by customer',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Booking is not in completed status',
  })
  @ApiResponse({ status: 403, description: 'Only customer can approve' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async customerApprove(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CustomerApproveBookingDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.customerApprove(
      id,
      input.feedback,
      input.rating,
      user,
    );
  }

  /**
   * POST /bookings/:id/request-reschedule
   * Seller requests customer to reschedule
   */
  @Post(':id/request-reschedule')
  @ApiOperation({
    summary: 'Request reschedule',
    description:
      'Seller requests the customer to reschedule the booking due to unavailability.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reschedule request sent',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Booking cannot be rescheduled in current status',
  })
  @ApiResponse({
    status: 403,
    description: 'Only seller can request reschedule',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async requestReschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: RequestRescheduleDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.requestReschedule(
      id,
      input.reason,
      input.suggested_times,
      user,
    );
  }

  /**
   * GET /bookings/:id/escrow
   * Get escrow status for a booking
   */
  @Get(':id/escrow')
  @ApiOperation({
    summary: 'Get booking escrow status',
    description:
      'Get escrow transactions and summary for a booking. Shows held, released, and refunded amounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingEscrow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.getEscrowStatus(id, user);
  }

  /**
   * GET /bookings/:id/payment-config
   * Get payment configuration for a booking
   */
  @Get(':id/payment-config')
  @ApiOperation({
    summary: 'Get booking payment configuration',
    description:
      'Get payment model and amounts for a booking. Includes breakdown of fees, payouts, and escrow configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment configuration retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingPaymentConfig(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.getPaymentConfig(id, user);
  }

  /**
   * GET /bookings/sellers/:sellerId/calendar
   * Get calendar data for a seller for a specific month
   */
  @Get('sellers/:sellerId/calendar')
  @ApiOperation({
    summary: 'Get seller calendar',
    description:
      'Get calendar data for a seller for a specific month. Returns days with booking counts and unavailability info.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar data for the month',
    type: CalendarDay,
    isArray: true,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getSellerCalendar(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query() query: CalendarMonthDto,
    @CurrentUser() user: User,
  ): Promise<CalendarDay[]> {
    const [year, month] = query.month.split('-').map(Number);
    return this.bookingsService.getCalendarMonth(sellerId, year, month, user);
  }

  /**
   * GET /bookings/sellers/:sellerId/schedule
   * Get day schedule for a seller for a specific date
   */
  @Get('sellers/:sellerId/schedule')
  @ApiOperation({
    summary: 'Get seller day schedule',
    description:
      'Get day schedule for a seller for a specific date. Returns timeline items (bookings and unavailability) for the day.',
  })
  @ApiResponse({
    status: 200,
    description: 'Day schedule items',
    type: DayScheduleItem,
    isArray: true,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getSellerDaySchedule(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query() query: DayScheduleDto,
    @CurrentUser() user: User,
  ): Promise<DayScheduleItem[]> {
    return this.bookingsService.getDaySchedule(sellerId, query.date, user);
  }

  /**
   * POST /bookings/:id/decline
   * Decline a booking (seller only)
   */
  @Post(':id/decline')
  @ApiOperation({
    summary: 'Decline booking',
    description:
      'Decline a pending booking with reason. Transitions status to CANCELLED. Only accessible by seller.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking declined successfully',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Booking cannot be declined' })
  @ApiResponse({ status: 403, description: 'Access denied - not the seller' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async declineBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: DeclineBookingDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.declineBooking(id, input, user);
  }

  /**
   * PATCH /bookings/:id/notes
   * Update provider notes for a booking
   */
  @Patch(':id/notes')
  @ApiOperation({
    summary: 'Update provider notes',
    description:
      'Update provider notes for a booking. Only accessible by seller or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notes updated successfully',
    type: Booking,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateProviderNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateProviderNotesDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.updateProviderNotes(id, input, user);
  }

  /**
   * GET /bookings/admin/:id
   * Get booking by ID (Admin - bypasses access check)
   */
  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Get booking by ID (Admin)',
    description:
      'Get booking details (admin only - bypasses access restrictions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async adminFindById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.findById(id, user, true);
  }

  /**
   * POST /bookings/admin/:id/force-cancel
   * Admin force cancel booking
   */
  @Post('admin/:id/force-cancel')
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Force cancel booking (Admin)',
    description:
      'Admin can force cancel any booking with custom refund percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async adminForceCancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AdminForceCancelDto,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    await this.bookingsService.adminForceCancel(
      id,
      input.reason,
      input.reason_details,
      input.refund_percent,
      user,
    );
    return this.bookingsService.findById(id, user, true);
  }

  /**
   * POST /bookings/admin/:id/force-complete
   * Admin force complete booking
   */
  @Post('admin/:id/force-complete')
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Force complete booking (Admin)',
    description: 'Admin can force complete any booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking completed successfully',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async adminForceComplete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.adminForceComplete(id, user);
  }

  /**
   * POST /bookings/admin/:id/refund
   * Admin initiate refund
   */
  @Post('admin/:id/refund')
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Initiate refund (Admin)',
    description: 'Admin can initiate a refund for any booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund initiated successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async adminRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: AdminRefundDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.adminInitiateRefund(
      id,
      input.amount,
      input.reason,
      user,
    );
  }

  /**
   * DELETE /bookings/:id
   * Delete a booking (admin only)
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Delete booking (Admin)',
    description:
      'Soft delete a booking record. Only accessible to system administrators.',
  })
  @ApiResponse({
    status: 204,
    description: 'Booking deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async deleteBooking(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.bookingsService.delete(id);
  }

  /**
   * DELETE /bookings
   * Bulk delete bookings (admin only)
   */
  @Delete()
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  @ApiOperation({
    summary: 'Bulk delete bookings (Admin)',
    description:
      'Soft delete multiple booking records. Only accessible to system administrators.',
  })
  @ApiResponse({
    status: 204,
    description: 'Bookings deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or validation failed',
  })
  @ApiResponse({ status: 404, description: 'One or more bookings not found' })
  async bulkDeleteBookings(
    @Body() input: BulkDeleteBookingsDto,
  ): Promise<void> {
    await this.bookingsService.bulkDelete(input.ids);
  }

  // ==================== DPO Assessment Endpoints ====================

  /**
   * POST /bookings/:id/complete-assessment
   * Mark an assessment booking as complete
   */
  @Post(':id/complete-assessment')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Complete assessment booking',
    description:
      'Marks an assessment booking as complete after all required checklist items are done. Only the seller can complete.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment completed',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Required checklist items incomplete',
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeAssessment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Booking> {
    return this.bookingsService.completeAssessment(id, user);
  }

  /**
   * GET /bookings/:id/checklist
   * Get assessment checklist items for a booking
   */
  @Get(':id/checklist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get assessment checklist',
    description: 'Returns all checklist items for an assessment booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Checklist items',
  })
  @ApiResponse({ status: 400, description: 'Not an assessment booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getAssessmentChecklist(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.getAssessmentChecklist(id, user);
  }
}
