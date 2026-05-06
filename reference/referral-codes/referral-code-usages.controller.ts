import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ReferralCodesService } from '@/referral-codes/referral-codes.service';
import { SelectReferralCodeVouchersDto } from '@/referral-codes/dto/select-referral-code-vouchers.dto';

@ApiTags('Referral Code Usages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'referral-code-usages', version: '1' })
export class ReferralCodeUsagesController {
  constructor(private readonly referralCodesService: ReferralCodesService) {}

  @Get('my')
  @ApiOperation({ summary: 'List my referral code usages' })
  getMyUsages(@CurrentUser() user: User) {
    return this.referralCodesService.getMyUsages(user);
  }

  @Get(':id/vouchers')
  @ApiOperation({ summary: 'List selectable vouchers for a pending usage' })
  getSelectableVouchers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.referralCodesService.getSelectableVouchers(id, user);
  }

  @Post(':id/select')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Submit voucher selection for a pending usage' })
  async selectVouchers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectReferralCodeVouchersDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.referralCodesService.selectVouchers(id, dto.voucher_ids, user);
  }
}
