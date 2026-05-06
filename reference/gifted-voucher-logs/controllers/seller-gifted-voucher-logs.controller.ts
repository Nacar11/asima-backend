import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { GiftedVoucherLogsService } from '@/gifted-voucher-logs/gifted-voucher-logs.service';
import { QueryGiftedVoucherLogDto } from '@/gifted-voucher-logs/dto/query-gifted-voucher-log.dto';
import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';

@ApiTags('Seller - Gifted Voucher Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'sellers/gifted-voucher-logs',
  version: '1',
})
export class SellerGiftedVoucherLogsController {
  constructor(private readonly service: GiftedVoucherLogsService) {}

  @Get()
  @ApiOkResponse({ type: GiftedVoucherLog, isArray: true })
  async findAll(
    @Query() query: QueryGiftedVoucherLogDto,
    @CurrentUser() currentUser: User,
  ) {
    if (!currentUser.seller_id) {
      throw new ForbiddenException(
        'Only sellers can view seller gifted voucher logs',
      );
    }

    const { data, totalCount } = await this.service.findAllForSeller(
      query,
      currentUser.seller_id,
    );
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: GiftedVoucherLog })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    if (!currentUser.seller_id) {
      throw new ForbiddenException(
        'Only sellers can view seller gifted voucher logs',
      );
    }

    const log = await this.service.findByIdForSeller(id, currentUser.seller_id);
    if (!log) {
      throw new NotFoundException('Gifted voucher log not found');
    }
    return log;
  }
}
