import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GuestVenueBookingService } from './guest-venue-booking.service';
import { VouchersService } from '@/vouchers/vouchers.service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import {
  ValidateVenueVoucherDto,
  ValidateVenueVoucherResponseDto,
} from './dto/validate-guest-voucher.dto';
import { CreateGuestVenueBookingsDto } from './dto/create-guest-venue-booking.dto';
import { GuestBookingResponseDto } from './dto/guest-booking-response.dto';
import { GuestBookingDetailDto } from './dto/guest-booking-detail.dto';
import { GetVenueCalendarDto } from './dto/get-venue-calendar.dto';
import { GuestBookingPaymentPageDto } from './dto/guest-booking-payment-page.dto';
import { GuestBookingPaymentStatusDto } from './dto/guest-booking-payment-status.dto';
import { NotifyGuestBookingPaymentDto } from './dto/notify-guest-booking-payment.dto';
import { AbandonGuestBookingPaymentDto } from './dto/abandon-guest-booking-payment.dto';
import { CreateGuestOpenPlayRegistrationDto } from './dto/create-guest-open-play-registration.dto';
import { QueryPublicOpenPlayEventsDto } from './dto/query-public-open-play-events.dto';
import { QueryPublicOpenPlayEventsListDto } from './dto/query-public-open-play-events-list.dto';

@ApiTags('Guest Venue Booking')
@Controller({ version: '1' })
export class GuestVenueBookingController {
  constructor(
    private readonly service: GuestVenueBookingService,
    private readonly vouchersService: VouchersService,
  ) {}

  @Get('public/services/slots')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get venue availability slots for all venue services (public)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-03-15',
    description:
      'Single date filter (YYYY-MM-DD). Optional if start_date/end_date are provided.',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2026-03-01',
    description: 'Range start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2026-03-31',
    description: 'Range end date (YYYY-MM-DD)',
  })
  @ApiOkResponse({ description: 'Slots returned' })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    enum: ['anjo-world', 'tambayan-district'],
    example: 'tambayan-district',
    description: 'Filter slots to a single public pickleball location.',
  })
  @HttpCode(HttpStatus.OK)
  async getSlots(
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('location') location?: string,
  ) {
    return this.service.getVenueAvailabilityByDateRange({
      date,
      start_date: startDate,
      end_date: endDate,
      location,
    });
  }

  @Get('public/services/calendar')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get venue calendar day status across all venue services (public)',
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
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @HttpCode(HttpStatus.OK)
  async getCalendar(@Query() query: GetVenueCalendarDto) {
    return this.service.getVenueCalendar(query);
  }

  @Get('public/open-play-events')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Get active open play events that are currently blocking venue slots for a date (public)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    example: '2026-03-26',
    description: 'Target date (YYYY-MM-DD).',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    enum: ['anjo-world', 'tambayan-district'],
    example: 'tambayan-district',
    description: 'Optional location filter.',
  })
  @ApiQuery({
    name: 'service_id',
    required: false,
    type: Number,
    example: 12,
    description: 'Optional venue service id filter.',
  })
  @ApiQuery({
    name: 'skill_level_code',
    required: false,
    type: String,
    example: 'intermediate',
    description: 'Optional skill level filter.',
  })
  @ApiOkResponse({ description: 'Open play events returned' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @HttpCode(HttpStatus.OK)
  async getPublicOpenPlayEvents(@Query() query: QueryPublicOpenPlayEventsDto) {
    return this.service.getPublicOpenPlayEvents(query);
  }

  @Get('public/open-play-events/list')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Get open play events list by date range for the public Open Plays screen',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    type: String,
    example: '2026-03-27',
    description:
      'Start date (YYYY-MM-DD). Defaults to current local date when omitted.',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    type: String,
    example: '2026-04-26',
    description:
      'End date (YYYY-MM-DD). Defaults to date_from + 30 days when omitted.',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    enum: ['anjo-world', 'tambayan-district'],
    example: 'tambayan-district',
    description: 'Optional location filter.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Pagination offset. Default: 0.',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Pagination size. Default: 20 (max: 200).',
  })
  @ApiQuery({
    name: 'skill_level_code',
    required: false,
    type: String,
    example: 'advanced',
    description: 'Optional skill level filter.',
  })
  @ApiOkResponse({ description: 'Open play events list returned' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @HttpCode(HttpStatus.OK)
  async getPublicOpenPlayEventsList(
    @Query() query: QueryPublicOpenPlayEventsListDto,
  ) {
    return this.service.getPublicOpenPlayEventsList(query);
  }

  @Post('guest/venue-bookings/validate-voucher')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Validate a voucher code for venue booking discount (authenticated)',
  })
  @ApiBody({ type: ValidateVenueVoucherDto })
  @ApiOkResponse({ type: ValidateVenueVoucherResponseDto })
  @HttpCode(HttpStatus.OK)
  async validateVoucher(
    @Body() dto: ValidateVenueVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<ValidateVenueVoucherResponseDto> {
    return this.vouchersService.validateVenueVoucher({
      code: dto.code,
      service_ids: dto.service_ids,
      total_amount: dto.total_amount,
      user_id: currentUser.id,
      exclude_user_voucher_ids: dto.exclude_user_voucher_ids,
    });
  }

  @Post('guest/venue-bookings')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create one or more guest venue bookings (public)' })
  @ApiBody({ type: CreateGuestVenueBookingsDto })
  @ApiCreatedResponse({ type: GuestBookingResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request or slot unavailable' })
  @HttpCode(HttpStatus.CREATED)
  async createGuestBooking(
    @Body() dto: CreateGuestVenueBookingsDto,
  ): Promise<GuestBookingResponseDto> {
    return this.service.createGuestBookings(
      dto.bookings,
      dto.voucher_assignments,
    );
  }

  @Post('guest/open-play-events/:eventId/register')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Register one or more participants for an open play event (public)',
  })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiBody({ type: CreateGuestOpenPlayRegistrationDto })
  @ApiCreatedResponse({ type: GuestBookingResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid request or open play registration closed/full',
  })
  @ApiNotFoundResponse({ description: 'Open play event not found' })
  @HttpCode(HttpStatus.CREATED)
  async registerGuestOpenPlay(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: CreateGuestOpenPlayRegistrationDto,
  ): Promise<GuestBookingResponseDto> {
    return this.service.createGuestOpenPlayRegistration(eventId, dto);
  }

  @Get('guest/venue-bookings/:bookingNumber/payment-page')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Get guest booking payment page data by booking reference + email (public)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiOkResponse({ type: GuestBookingPaymentPageDto })
  @ApiForbiddenResponse({ description: 'Email does not match booking' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @HttpCode(HttpStatus.OK)
  async getGuestBookingPaymentPage(
    @Param('bookingNumber') bookingNumber: string,
    @Query('email') email: string,
  ): Promise<GuestBookingPaymentPageDto> {
    return this.service.getGuestBookingPaymentPage(bookingNumber, email);
  }

  @Post('guest/venue-bookings/:bookingNumber/notify-payment')
  @UseGuards(AuthGuard('anonymous'))
  @UseInterceptors(FileInterceptor('payment_proof'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Notify payment for guest booking reference (moves booking to awaiting_confirmation)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: NotifyGuestBookingPaymentDto })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Email does not match booking' })
  @ApiNotFoundResponse({ description: 'Booking or payment not found' })
  @HttpCode(HttpStatus.OK)
  async notifyGuestBookingPayment(
    @Param('bookingNumber') bookingNumber: string,
    @Body() dto: NotifyGuestBookingPaymentDto,
    @UploadedFile() paymentProofFile?: Express.Multer.File,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.notifyGuestBookingPayment(
      bookingNumber,
      dto,
      paymentProofFile,
    );
  }

  @Post('guest/venue-bookings/:bookingNumber/abandon-payment')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Mark guest booking payment as abandoned and immediately release reserved slot(s)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiBody({ type: AbandonGuestBookingPaymentDto })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Email does not match booking' })
  @ApiNotFoundResponse({ description: 'Booking or payment not found' })
  @HttpCode(HttpStatus.OK)
  async abandonGuestBookingPayment(
    @Param('bookingNumber') bookingNumber: string,
    @Body() dto: AbandonGuestBookingPaymentDto,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.abandonGuestBookingPayment(bookingNumber, dto.email);
  }

  @Get('guest/venue-bookings/:bookingNumber/payment-status')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get guest booking payment status by booking reference + email',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiForbiddenResponse({ description: 'Email does not match booking' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @HttpCode(HttpStatus.OK)
  async getGuestBookingPaymentStatus(
    @Param('bookingNumber') bookingNumber: string,
    @Query('email') email: string,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.getGuestBookingPaymentStatus(bookingNumber, email);
  }

  @Get('guest/venue-bookings/:bookingNumber')
  @UseGuards(AuthGuard('anonymous'))
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Lookup guest booking by booking reference + email (public)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiOkResponse({ type: GuestBookingDetailDto })
  @ApiForbiddenResponse({ description: 'Email does not match booking' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @HttpCode(HttpStatus.OK)
  async getGuestBooking(
    @Param('bookingNumber') bookingNumber: string,
    @Query('email') email: string,
  ): Promise<GuestBookingDetailDto> {
    return this.service.getGuestBookingByNumber(bookingNumber, email);
  }
}
