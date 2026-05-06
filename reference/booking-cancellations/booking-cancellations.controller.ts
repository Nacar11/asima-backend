import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BookingCancellationsService } from './booking-cancellations.service';
import { BookingCancellation } from './domain/booking-cancellation';
import { CreateBookingCancellationDto } from './dto/create-booking-cancellation.dto';
import { QueryBookingCancellationDto } from './dto/query-booking-cancellation.dto';
import { CancellationPreviewDto } from './dto/cancellation-preview.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Controller for booking cancellation endpoints.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Booking Cancellations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'booking-cancellations',
  version: '1',
})
export class BookingCancellationsController {
  constructor(private readonly service: BookingCancellationsService) {}

  /**
   * Cancel a booking.
   */
  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Cancels a booking, calculates refund based on policy, and processes escrow refund',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Booking ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking cancelled successfully',
    type: BookingCancellation,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - booking cannot be cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async cancelBooking(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body(new ValidationPipe({ transform: true }))
    createDto: CreateBookingCancellationDto,
    @CurrentUser() user: User,
  ): Promise<BookingCancellation> {
    return this.service.cancelBooking(bookingId, createDto, user);
  }

  /**
   * Get all cancellations.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all booking cancellations',
    description: 'Retrieves all booking cancellations with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cancellations',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    queryDto: QueryBookingCancellationDto,
  ) {
    return this.service.findAll(queryDto);
  }

  /**
   * Get cancellation preview for a booking.
   */
  @Get('bookings/:id/preview')
  @ApiOperation({
    summary: 'Get cancellation preview',
    description:
      'Preview the refund amounts before confirming cancellation. Shows policy, fees, and refund breakdown.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Booking ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancellation preview with refund breakdown',
    type: CancellationPreviewDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Booking cannot be cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async getCancellationPreview(
    @Param('id', ParseIntPipe) bookingId: number,
    @CurrentUser() user: User,
  ): Promise<CancellationPreviewDto> {
    return this.service.getCancellationPreview(bookingId, user);
  }

  /**
   * Get cancellation by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get cancellation by ID',
    description: 'Retrieves a specific cancellation record',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Cancellation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancellation record',
    type: BookingCancellation,
  })
  @ApiResponse({
    status: 404,
    description: 'Cancellation not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookingCancellation> {
    return this.service.findById(id);
  }

  /**
   * Get cancellation by booking ID.
   */
  @Get('booking/:bookingId')
  @ApiOperation({
    summary: 'Get cancellation by booking ID',
    description: 'Retrieves cancellation record for a specific booking',
  })
  @ApiParam({
    name: 'bookingId',
    type: Number,
    description: 'Booking ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancellation record',
    type: BookingCancellation,
  })
  @ApiResponse({
    status: 404,
    description: 'Cancellation not found',
  })
  async findByBookingId(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<BookingCancellation | null> {
    return this.service.findByBookingId(bookingId);
  }
}
