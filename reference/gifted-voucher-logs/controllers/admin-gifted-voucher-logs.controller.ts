import {
  Controller,
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
import { GiftedVoucherLogsService } from '@/gifted-voucher-logs/gifted-voucher-logs.service';
import { QueryGiftedVoucherLogDto } from '@/gifted-voucher-logs/dto/query-gifted-voucher-log.dto';
import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';

@ApiTags('Admin - Gifted Voucher Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'admin/gifted-voucher-logs',
  version: '1',
})
export class AdminGiftedVoucherLogsController {
  constructor(private readonly service: GiftedVoucherLogsService) {}

  @Get()
  @ApiOkResponse({ type: GiftedVoucherLog, isArray: true })
  async findAll(@Query() query: QueryGiftedVoucherLogDto) {
    const { data, totalCount } = await this.service.findAllForAdmin(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: GiftedVoucherLog })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const log = await this.service.findById(id);
    if (!log) {
      throw new NotFoundException('Gifted voucher log not found');
    }
    return log;
  }
}
