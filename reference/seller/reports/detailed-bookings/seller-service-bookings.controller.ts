import {
  Controller,
  Get,
  Param,
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
import { QuerySellerDetailedBookingsDto } from './dto/query-seller-detailed-bookings.dto';
import {
  SellerDetailedBookingDetailResponse,
  SellerDetailedBookingsListResponse,
  SellerDetailedBookingsService,
} from './seller-detailed-bookings.service';

@ApiTags('Seller - Service Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'seller/service-bookings',
  version: '1',
})
export class SellerServiceBookingsController {
  constructor(private readonly service: SellerDetailedBookingsService) {}

  @Get()
  @Permissions({ SM16: 'View' })
  @ApiOperation({
    summary: 'List seller service bookings',
    description:
      'Returns service booking rows for the current seller using the Service Booking permission scope.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated service bookings response',
  })
  async findAll(
    @Query() query: QuerySellerDetailedBookingsDto,
    @CurrentUser() user: User,
  ): Promise<SellerDetailedBookingsListResponse> {
    return this.service.findAll(query, user);
  }

  @Get(':bookingId')
  @Permissions({ SM16: 'View' })
  @ApiOperation({
    summary: 'Get service booking by booking ID',
    description:
      'Returns service booking details for the current seller using the Service Booking permission scope.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service booking detail response',
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
