import {
  Controller,
  Get,
  Post,
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
import { WalletsService } from '@/wallets/wallets.service';
import { AdminFreezeWalletDto } from '@/wallets/dto/admin-freeze-wallet.dto';
import { AdminAdjustWalletDto } from '@/wallets/dto/admin-adjust-wallet.dto';
import { QueryWalletTransactionsDto } from '@/wallets/dto/query-wallet-transactions.dto';

@ApiTags('Admin - Wallets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/wallets',
  version: '1',
})
export class AdminWalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'List all seller wallets with seller context' })
  listWallets(
    @Query('status') status?: string,
    @Query('seller_name') seller_name?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletsService.adminListWalletsWithContext({
      status,
      seller_name,
      page,
      limit,
    });
  }

  @Get('platform')
  @ApiOperation({ summary: 'Get platform (admin) wallet balance and stats' })
  getPlatformWallet() {
    return this.walletsService.getPlatformWallet();
  }

  @Get('platform/transactions')
  @ApiOperation({ summary: 'Get platform wallet transaction history' })
  getPlatformWalletTransactions(
    @Query('type') type?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletsService.getPlatformWalletTransactions({
      type,
      date_from,
      date_to,
      page,
      limit,
    });
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transaction history for a specific wallet' })
  getWalletTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryWalletTransactionsDto,
  ) {
    return this.walletsService.adminGetWalletTransactions(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet by ID with seller context' })
  getWallet(@Param('id', ParseIntPipe) id: number) {
    return this.walletsService.adminGetWalletWithContext(id);
  }

  @Patch(':id/freeze')
  @ApiOperation({ summary: 'Freeze a seller wallet' })
  freezeWallet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminFreezeWalletDto,
  ) {
    return this.walletsService.adminFreezeWallet(id, dto.reason);
  }

  @Patch(':id/unfreeze')
  @ApiOperation({ summary: 'Unfreeze a seller wallet' })
  unfreezeWallet(@Param('id', ParseIntPipe) id: number) {
    return this.walletsService.adminUnfreezeWallet(id);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Manual balance adjustment' })
  adjustWallet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminAdjustWalletDto,
  ) {
    return this.walletsService.adminAdjustWallet(
      id,
      dto.amount,
      dto.direction,
      dto.reason,
    );
  }
}
