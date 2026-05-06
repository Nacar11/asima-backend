import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GuestVenueBookingService } from './guest-venue-booking.service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { GuestBookingPaymentPageDto } from './dto/guest-booking-payment-page.dto';
import { GuestBookingPaymentStatusDto } from './dto/guest-booking-payment-status.dto';
import { NotifyServiceBookingPaymentDto } from './dto/notify-service-booking-payment.dto';

@ApiTags('Service Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'service-bookings', version: '1' })
export class ServiceBookingsController {
  constructor(private readonly service: GuestVenueBookingService) {}

  @Get(':bookingNumber/payment-page')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get service booking payment page data (authenticated customer)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiOkResponse({ type: GuestBookingPaymentPageDto })
  @ApiForbiddenResponse({ description: 'Booking does not belong to this user' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @HttpCode(HttpStatus.OK)
  async getPaymentPage(
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: User,
  ): Promise<GuestBookingPaymentPageDto> {
    return this.service.getServiceBookingPaymentPage(bookingNumber, user);
  }

  @Post(':bookingNumber/notify-payment')
  @UseInterceptors(FileInterceptor('payment_proof'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Notify payment for service booking (moves booking to awaiting_confirmation)',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: NotifyServiceBookingPaymentDto })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Booking does not belong to this user' })
  @ApiNotFoundResponse({ description: 'Booking or payment not found' })
  @HttpCode(HttpStatus.OK)
  async notifyPayment(
    @Param('bookingNumber') bookingNumber: string,
    @Body() dto: NotifyServiceBookingPaymentDto,
    @CurrentUser() user: User,
    @UploadedFile() paymentProofFile?: Express.Multer.File,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.notifyServiceBookingPayment(
      bookingNumber,
      dto,
      user,
      paymentProofFile,
    );
  }

  @Get(':bookingNumber/payment-status')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get service booking payment status',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiForbiddenResponse({ description: 'Booking does not belong to this user' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @HttpCode(HttpStatus.OK)
  async getPaymentStatus(
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: User,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.getServiceBookingPaymentStatus(bookingNumber, user);
  }

  @Post(':bookingNumber/abandon-payment')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Mark service booking payment as abandoned and release the reserved slot',
  })
  @ApiParam({ name: 'bookingNumber', type: String })
  @ApiOkResponse({ type: GuestBookingPaymentStatusDto })
  @ApiBadRequestResponse({ description: 'Invalid booking/payment state' })
  @ApiForbiddenResponse({ description: 'Booking does not belong to this user' })
  @ApiNotFoundResponse({ description: 'Booking or payment not found' })
  @HttpCode(HttpStatus.OK)
  async abandonPayment(
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: User,
  ): Promise<GuestBookingPaymentStatusDto> {
    return this.service.abandonServiceBookingPayment(bookingNumber, user);
  }
}
