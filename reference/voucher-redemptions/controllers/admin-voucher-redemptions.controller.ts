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
import { VoucherRedemptionsService } from '@/voucher-redemptions/voucher-redemptions.service';
import { QueryVoucherRedemptionDto } from '@/voucher-redemptions/dto/query-voucher-redemption.dto';
import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';

@ApiTags('Admin - Voucher Redemptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'admin/voucher-redemptions',
  version: '1',
})
export class AdminVoucherRedemptionsController {
  constructor(private readonly service: VoucherRedemptionsService) {}

  @Get()
  @ApiOkResponse({ type: VoucherRedemption, isArray: true })
  async findAll(@Query() query: QueryVoucherRedemptionDto) {
    const { data, totalCount } = await this.service.findAllForAdmin(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: VoucherRedemption })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const redemption = await this.service.findById(id);
    if (!redemption) {
      throw new NotFoundException('Voucher redemption not found');
    }
    return redemption;
  }
}
