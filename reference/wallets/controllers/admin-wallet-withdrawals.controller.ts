import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import { WalletWithdrawalService } from '@/wallets/services/wallet-withdrawal.service';
import { AdminCompleteWithdrawalDto } from '@/wallets/dto/admin-complete-withdrawal.dto';
import { AdminFailWithdrawalDto } from '@/wallets/dto/admin-fail-withdrawal.dto';

@ApiTags('Admin - Withdrawals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/withdrawals',
  version: '1',
})
export class AdminWalletWithdrawalsController {
  constructor(private readonly withdrawalService: WalletWithdrawalService) {}

  @Get()
  @ApiOperation({
    summary: 'List all withdrawal requests with seller and bank context',
  })
  listWithdrawals(
    @Query('status') status?: string,
    @Query('wallet_id') wallet_id?: number,
    @Query('seller_name') seller_name?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.withdrawalService.listAllWithContext({
      status,
      wallet_id: wallet_id ? Number(wallet_id) : undefined,
      seller_name,
      date_from,
      date_to,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single withdrawal with seller and bank context',
  })
  getWithdrawal(@Param('id', ParseIntPipe) id: number) {
    return this.withdrawalService.findOneForAdmin(id);
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Mark withdrawal as processing' })
  processWithdrawal(@Param('id', ParseIntPipe) id: number) {
    return this.withdrawalService.markAsProcessing(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark withdrawal as completed' })
  completeWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminCompleteWithdrawalDto,
  ) {
    return this.withdrawalService.markAsCompleted(
      id,
      dto.bank_reference_number,
    );
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Mark withdrawal as failed (refunds balance)' })
  failWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminFailWithdrawalDto,
  ) {
    return this.withdrawalService.markAsFailed(id, dto.reason);
  }
}
