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
import { VoucherRedemptionsService } from '@/voucher-redemptions/voucher-redemptions.service';
import { QueryVoucherRedemptionDto } from '@/voucher-redemptions/dto/query-voucher-redemption.dto';
import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';

@ApiTags('Seller - Voucher Redemptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'sellers/voucher-redemptions',
  version: '1',
})
export class SellerVoucherRedemptionsController {
  constructor(private readonly service: VoucherRedemptionsService) {}

  @Get()
  @ApiOkResponse({ type: VoucherRedemption, isArray: true })
  async findAll(
    @Query() query: QueryVoucherRedemptionDto,
    @CurrentUser() currentUser: User,
  ) {
    if (!currentUser.seller_id) {
      throw new ForbiddenException(
        'Only sellers can view seller voucher redemptions',
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
  @ApiOkResponse({ type: VoucherRedemption })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    if (!currentUser.seller_id) {
      throw new ForbiddenException(
        'Only sellers can view seller voucher redemptions',
      );
    }
    const redemption = await this.service.findByIdForSeller(
      id,
      currentUser.seller_id,
    );
    if (!redemption) {
      throw new NotFoundException('Voucher redemption not found');
    }
    return redemption;
  }
}
