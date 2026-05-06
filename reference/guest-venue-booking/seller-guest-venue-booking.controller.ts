import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import { GuestVenueBookingService } from './guest-venue-booking.service';
import { GuestBookingPaymentStatusDto } from './dto/guest-booking-payment-status.dto';
import { QuerySellerAwaitingConfirmationDto } from './dto/query-seller-awaiting-confirmation.dto';
import { SellerAwaitingConfirmationResponseDto } from './dto/seller-awaiting-confirmation-response.dto';
import { RejectGuestBookingPaymentDto } from './dto/reject-guest-booking-payment.dto';
import { GetVenueCalendarDto } from './dto/get-venue-calendar.dto';
import { CreateAdminGuestVenueBookingsDto } from './dto/create-admin-guest-venue-booking.dto';
import { GuestBookingResponseDto } from './dto/guest-booking-response.dto';
import { CreateOpenPlayEventDto } from './dto/create-open-play-event.dto';
import { CreateRecurringOpenPlayEventsDto } from './dto/create-recurring-open-play-events.dto';
import { QueryOpenPlayEventsDto } from './dto/query-open-play-events.dto';
import { UpdateOpenPlayEventDto } from './dto/update-open-play-event.dto';

const parseBooleanQuery = (value?: string): boolean => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'on'
  );
};

@ApiTags('Seller - Guest Venue Booking')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ version: '1', path: 'seller/bookings' })
export class SellerGuestVenueBookingController {
  constructor(private readonly service: GuestVenueBookingService) {}

  @Post('admin/venue-bookings')
  @UseGuards(SystemAdminGuard)
  @SystemAdmin(true)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create admin venue booking(s) without customer details or amount',
  })
  @ApiBody({ type: CreateAdminGuestVenueBookingsDto })
  @ApiCreatedResponse({ type: GuestBookingResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request or slot unavailable' })
  @ApiForbiddenResponse({ description: 'System admin access required' })
  @HttpCode(HttpStatus.CREATED)
  async createAdminVenueBookings(
    @Body() dto: CreateAdminGuestVenueBookingsDto,
    @CurrentUser() user: User,
  ): Promise<GuestBookingResponseDto> {
    return this.service.createAdminVenueBookings(dto.bookings, user);
  }

  @Post('open-play-events')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create an open play event and block its venue time window',
  })
  @ApiBody({ type: CreateOpenPlayEventDto })
  @ApiCreatedResponse({
    description: 'Open play event created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiForbiddenResponse({
    description: 'Open play event does not belong to current seller scope',
  })
  @HttpCode(HttpStatus.CREATED)
  async createOpenPlayEvent(
    @Body() dto: CreateOpenPlayEventDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createOpenPlayEvent(dto, user);
  }

  @Post('open-play-events/recurring')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Create recurring open play events with partial-success handling per occurrence',
  })
  @ApiBody({ type: CreateRecurringOpenPlayEventsDto })
  @ApiCreatedResponse({
    description:
      'Recurring open play processing completed with created and failed occurrence details',
  })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiForbiddenResponse({
    description: 'Open play event does not belong to current seller scope',
  })
  @HttpCode(HttpStatus.CREATED)
  async createRecurringOpenPlayEvents(
    @Body() dto: CreateRecurringOpenPlayEventsDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createRecurringOpenPlayEvents(dto, user);
  }

  @Get('open-play-events')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'List open play events for seller/admin scope',
  })
  @ApiOkResponse({
    description: 'Paginated list of open play events',
  })
  @ApiQuery({
    name: 'skill_level_code',
    required: false,
    type: String,
    example: 'beginner',
    description: 'Optional skill level filter.',
  })
  @HttpCode(HttpStatus.OK)
  async getOpenPlayEvents(
    @Query() query: QueryOpenPlayEventsDto,
    @CurrentUser() user: User,
  ) {
    return this.service.getSellerOpenPlayEvents(query, user);
  }

  @Patch('open-play-events/:id/cancel')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Cancel an open play event and release linked store-unavailability block',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Open play event cancelled successfully',
  })
  @ApiNotFoundResponse({ description: 'Open play event not found' })
  @ApiForbiddenResponse({
    description: 'Open play event does not belong to current seller scope',
  })
  @HttpCode(HttpStatus.OK)
  async cancelOpenPlayEvent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.cancelOpenPlayEvent(id, user);
  }

  @Get('open-play-events/:id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get a single open play event by ID for seller/admin scope',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Open play event details returned',
  })
  @ApiNotFoundResponse({ description: 'Open play event not found' })
  @ApiForbiddenResponse({
    description: 'Open play event does not belong to current seller scope',
  })
  @HttpCode(HttpStatus.OK)
  async getOpenPlayEventById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.getOpenPlayEventById(id, user);
  }

  @Patch('open-play-events/:id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Update editable fields of an open play event (title, rate, max_applicants, skill_level)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateOpenPlayEventDto })
  @ApiOkResponse({
    description: 'Open play event updated successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid payload or max_applicants below currently registered guests',
  })
  @ApiNotFoundResponse({ description: 'Open play event not found' })
  @ApiForbiddenResponse({
    description: 'Open play event does not belong to current seller scope',
  })
  @HttpCode(HttpStatus.OK)
  async updateOpenPlayEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOpenPlayEventDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateOpenPlayEvent(id, dto, user);
  }

  @Get('services/calendar')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Get venue calendar day status for authorized seller/admin (non-public)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-03-13',
    description:
      'Specific date (YYYY-MM-DD). Use this, or provide start_date/end_date.',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2026-03-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2026-03-31',
  })
  @ApiQuery({
    name: 'service_id',
    required: false,
    type: Number,
    example: 12,
    description: 'Specific venue service id to filter calendar results',
  })
  @ApiOkResponse({ description: 'Calendar day status returned' })
  @ApiForbiddenResponse({
    description: 'Access denied for this seller/service scope',
  })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @HttpCode(HttpStatus.OK)
  async getSellerVenueCalendar(
    @Query() query: GetVenueCalendarDto,
    @CurrentUser() user: User,
  ) {
    return this.service.getVenueCalendarForSeller(query, user);
  }

  @Get('awaiting-confirmation')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary:
      'List guest bookings awaiting payment confirmation for seller/admin',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: SellerAwaitingConfirmationResponseDto })
  @ApiForbiddenResponse({ description: 'Seller access required' })
  @HttpCode(HttpStatus.OK)
  async getAwaitingConfirmationBookings(
    @Query() query: QuerySellerAwaitingConfirmationDto,
    @CurrentUser() user: User,
  ): Promise<SellerAwaitingConfirmationResponseDto> {
    return this.service.getSellerAwaitingConfirmationBookings(user, query);
  }

  @Patch(':id/confirm-payment')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Confirm guest booking payment (awaiting_confirmation -> confirmed)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Booking does not belong to seller' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({
    name: 'apply_to_group',
    required: false,
    type: Boolean,
    description:
      'When true, confirm all sibling bookings linked to the same payment group.',
  })
  @HttpCode(HttpStatus.OK)
  async confirmGuestBookingPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Query('apply_to_group') applyToGroup?: string,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.confirmGuestBookingPaymentBySeller(id, user, {
      applyToGroup: parseBooleanQuery(applyToGroup),
    });
  }

  @Patch(':id/reject-payment')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Reject guest booking payment (awaiting_confirmation -> cancelled)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Booking does not belong to seller' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiQuery({
    name: 'apply_to_group',
    required: false,
    type: Boolean,
    description:
      'When true, reject all sibling bookings linked to the same payment group.',
  })
  @HttpCode(HttpStatus.OK)
  async rejectGuestBookingPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectGuestBookingPaymentDto,
    @CurrentUser() user: User,
    @Query('apply_to_group') applyToGroup?: string,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.rejectGuestBookingPaymentBySeller(
      id,
      user,
      dto.reason,
      {
        applyToGroup: parseBooleanQuery(applyToGroup),
      },
    );
  }
}
