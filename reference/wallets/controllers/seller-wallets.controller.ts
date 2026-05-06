import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SellerGuard } from '@/users/user.guard';
import { WalletsService } from '@/wallets/wallets.service';
import { QueryWalletTransactionsDto } from '@/wallets/dto/query-wallet-transactions.dto';
import { WithdrawFundsDto } from '@/wallets/dto/withdraw-funds.dto';

@ApiTags('Seller Wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SellerGuard)
@Controller({
  path: 'sellers/wallet',
  version: '1',
})
export class SellerWalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get seller wallet balance' })
  getWallet(@Request() req) {
    return this.walletsService.getSellerWallet(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  getTransactions(@Request() req, @Query() query: QueryWalletTransactionsDto) {
    return this.walletsService.getTransactions(req.user.id, query);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request a withdrawal' })
  requestWithdrawal(@Request() req, @Body() dto: WithdrawFundsDto) {
    return this.walletsService.requestWithdrawal(
      req.user.id,
      dto.amount,
      dto.bank_account_id,
    );
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List withdrawal history' })
  listWithdrawals(@Request() req) {
    return this.walletsService.listWithdrawals(req.user.id);
  }

  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get withdrawal detail' })
  getWithdrawal(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.walletsService.getWithdrawal(id, req.user.id);
  }
}
