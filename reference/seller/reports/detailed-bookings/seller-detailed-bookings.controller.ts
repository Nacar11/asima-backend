import {
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { QuerySellerDetailedBlockedSlotsDto } from './dto/query-seller-detailed-blocked-slots.dto';
import { QuerySellerDetailedBookingsDto } from './dto/query-seller-detailed-bookings.dto';
import {
  SellerDetailedBookingDetailResponse,
  SellerDetailedBlockedSlotRow,
  SellerDetailedBlockedSlotsListResponse,
  SellerDetailedBookingsListResponse,
  SellerDetailedBookingsService,
} from './seller-detailed-bookings.service';

@ApiTags('Seller - Detailed Bookings Report')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'seller/reports/detailed-bookings',
  version: '1',
})
export class SellerDetailedBookingsController {
  constructor(private readonly service: SellerDetailedBookingsService) {}

  @Get()
  @Permissions({ SM15: 'View' })
  @ApiOperation({
    summary: 'List seller detailed bookings report rows',
    description:
      'Returns bookings with statement-of-account fields and compact sales_order summary for the current seller.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated detailed bookings report response',
  })
  async findAll(
    @Query() query: QuerySellerDetailedBookingsDto,
    @CurrentUser() user: User,
  ): Promise<SellerDetailedBookingsListResponse> {
    return this.service.findAll(query, user);
  }

  @Get('blocked-slots')
  @Permissions({ SM15: 'View' })
  @ApiOperation({
    summary: 'List seller detailed report blocked slots',
    description:
      'Returns seller store-unavailability records for Slot Blocked tab in Detailed Reports.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated blocked slots report response',
  })
  async findBlockedSlots(
    @Query() query: QuerySellerDetailedBlockedSlotsDto,
    @CurrentUser() user: User,
  ): Promise<SellerDetailedBlockedSlotsListResponse> {
    return this.service.findBlockedSlots(query, user);
  }

  @Patch('blocked-slots/:id/release')
  @Permissions({ SM15: 'View' })
  @ApiOperation({
    summary: 'Release blocked slot in detailed report',
    description:
      'Releases a blocked slot record. Only future blocked slots can be released.',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked slot released successfully',
  })
  async releaseBlockedSlot(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SellerDetailedBlockedSlotRow> {
    return this.service.releaseBlockedSlot(id, user);
  }

  @Get(':bookingId')
  @Permissions({ SM15: 'View' })
  @ApiOperation({
    summary: 'Get detailed booking report by booking ID',
    description:
      'Returns booking details, statement-of-account summary, sales_order with items, and escrow timeline.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed booking report response',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async findById(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: User,
  ): Promise<SellerDetailedBookingDetailResponse> {
    return this.service.findById(bookingId, user);
  }
}
