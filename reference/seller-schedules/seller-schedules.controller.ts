import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { CreateSellerScheduleDto } from '@/seller-schedules/dto/create-seller-schedule.dto';
import { UpdateSellerScheduleDto } from '@/seller-schedules/dto/update-seller-schedule.dto';
import { QuerySellerScheduleDto } from '@/seller-schedules/dto/query-seller-schedule.dto';
import { SellerSchedule } from '@/seller-schedules/domain/seller-schedule';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { CheckAvailabilityDto } from '@/seller-schedules/dto/check-availability.dto';
import {
  AvailableSlotsDto,
  AvailableSlotResponseDto,
} from './dto/available-slots.dto';
import {
  BulkCheckAvailabilityDto,
  BulkCheckAvailabilityResponseDto,
} from './dto/bulk-check-availability.dto';

/**
 * Store Schedules Controller
 * Simplified: No member-specific endpoints (seller is the provider).
 */
@ApiTags('Store Schedules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'store-schedules',
  version: '1',
})
export class SellerSchedulesController {
  constructor(private readonly service: SellerSchedulesService) {}

  @Post()
  @ApiCreatedResponse({ type: SellerSchedule })
  create(
    @Body() dto: CreateSellerScheduleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: SellerSchedule, isArray: true })
  async findAll(@Query() query: QuerySellerScheduleDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  /**
   * Check if a specific time slot is available for booking.
   *
   * Performs a comprehensive availability check including:
   *
   * **LEVEL 1: Seller-Level Validations**
   * - Seller schedule exists for that day (Mon-Sun)
   * - Schedule status is ACTIVE
   * - Time is within working hours (start_time ↔ end_time)
   * - Time is not during break (break_start ↔ break_end)
   * - No store unavailability blocks
   * - max_concurrent_bookings not exceeded
   *
   * **LEVEL 2: Service-Level Validations** (requires service_id)
   * - Within advance_booking_days limit
   * - minimum_notice_hours satisfied (interpreted as minutes)
   * - max_daily_bookings (per service) not exceeded
   * - Location within service_areas coverage (if location params provided)
   *
   * @example
   * GET /v1/store-schedules/availability?seller_id=1&date=2025-01-15&start_time=09:00&end_time=10:00
   * GET /v1/store-schedules/availability?seller_id=1&date=2025-01-15&start_time=09:00&end_time=10:00&service_id=1&city=Cebu%20City
   */
  @Get('availability')
  @ApiOperation({
    summary: 'Check time slot availability',
    description: `
      Comprehensive availability check for a specific time slot.
      
      **LEVEL 1: Seller-Level Validations**
      1. Seller schedule exists for that day (Mon-Sun)
      2. Schedule status is ACTIVE
      3. Time within working hours (start_time ↔ end_time)
      4. Not during break time (break_start ↔ break_end)
      5. No store unavailability blocks
      6. max_concurrent_bookings not exceeded
      
      **LEVEL 2: Service-Level Validations** (when service_id provided)
      7. Within advance_booking_days limit
      8. minimum_notice_hours satisfied (interpreted as minutes)
      9. max_daily_bookings not exceeded
      10. Location within service_areas coverage
    `,
  })
  @ApiOkResponse({
    description: 'Availability check result',
    schema: {
      type: 'object',
      properties: {
        available: {
          type: 'boolean',
          description: 'Whether the slot is available',
        },
        reason: {
          type: 'string',
          nullable: true,
          description: 'Reason if not available',
        },
        concurrent_bookings: {
          type: 'number',
          description: 'Current concurrent bookings at this time',
        },
        max_concurrent: {
          type: 'number',
          description: 'Maximum allowed concurrent bookings',
        },
      },
    },
  })
  checkAvailability(@Query() query: CheckAvailabilityDto) {
    return this.service.checkAvailability(query);
  }

  /**
   * Bulk check availability for multiple service items.
   *
   * Useful for checkout validation where multiple service items
   * need to be checked at once before placing an order.
   *
   * @example
   * POST /v1/store-schedules/availability/bulk
   * {
   *   "items": [
   *     { "seller_id": 1, "service_id": 10, "date": "2025-01-15", "start_time": "10:00:00", "end_time": "12:00:00" },
   *     { "seller_id": 2, "service_id": 20, "date": "2025-01-16", "start_time": "14:00:00", "end_time": "15:30:00" }
   *   ]
   * }
   */
  @Post('availability/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk check availability for multiple service items',
    description: `
      Check availability for multiple service items at once.
      
      Useful for validating all services in a cart before placing an order.
      Each item is checked in parallel for efficiency.
      
      Returns individual results for each item plus an overall all_available flag.
    `,
  })
  @ApiOkResponse({
    type: BulkCheckAvailabilityResponseDto,
    description: 'Bulk availability check results',
  })
  checkBulkAvailability(@Body() dto: BulkCheckAvailabilityDto) {
    return this.service.checkBulkAvailability(dto.items);
  }

  /**
   * Get all available time slots for a service on a specific date.
   *
   * Returns a list of time slots with their availability status.
   * Applies all Level 1 (Seller) and Level 2 (Service) validations.
   *
   * @example
   * GET /v1/store-schedules/available-slots?service_id=1&date=2025-01-15
   * GET /v1/store-schedules/available-slots?service_id=1&date=2025-01-15&slot_duration_minutes=60
   */
  @Get('available-slots')
  @ApiOperation({
    summary: 'Get available time slots',
    description: `
      Returns all available time slots for a service on a specific date.
      
      Automatically applies:
      - Seller schedule constraints (working hours, breaks)
      - Store unavailability blocks
      - Concurrent booking capacity
      - Service-level constraints (advance booking, notice hours, daily limits)
    `,
  })
  @ApiOkResponse({
    type: AvailableSlotResponseDto,
    isArray: true,
    description: 'List of time slots with availability status',
  })
  getAvailableSlots(@Query() query: AvailableSlotsDto) {
    return this.service.getAvailableSlots(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerSchedule })
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerSchedule })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerScheduleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
