import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SellerPayoutAccountsService } from './seller-payout-accounts.service';
import { CreateSellerPayoutAccountDto } from './dto/create-seller-payout-account.dto';
import { UpdateSellerPayoutAccountDto } from './dto/update-seller-payout-account.dto';
import { QuerySellerPayoutAccountDto } from './dto/query-seller-payout-account.dto';
import { SellerPayoutAccount } from './domain/seller-payout-account';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Payout Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-payout-accounts',
  version: '1',
})
export class SellerPayoutAccountsController {
  constructor(private readonly service: SellerPayoutAccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: SellerPayoutAccount,
    description: 'Seller payout account created successfully',
  })
  create(@Body() dto: CreateSellerPayoutAccountDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOkResponse({
    type: SellerPayoutAccount,
    isArray: true,
    description: 'List of seller payout accounts',
  })
  findAll(
    @Query() query: QuerySellerPayoutAccountDto,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, user);
  }

  @Get('seller/:sellerId')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    type: SellerPayoutAccount,
    isArray: true,
    description: 'Seller payout accounts for a specific seller',
  })
  findBySellerId(
    @Param('sellerId') sellerId: number,
    @CurrentUser() user: User,
  ) {
    return this.service.findBySellerId(sellerId, user);
  }

  @Get('seller/:sellerId/default')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    type: SellerPayoutAccount,
    description: 'Default payout account for a seller',
  })
  getDefaultAccount(
    @Param('sellerId') sellerId: number,
    @CurrentUser() user: User,
  ) {
    return this.service.getDefaultAccount(sellerId, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerPayoutAccount,
    description: 'Seller payout account details',
  })
  findById(@Param('id') id: number, @CurrentUser() user: User) {
    return this.service.findById(id, user);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerPayoutAccount,
    description: 'Seller payout account updated successfully',
  })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerPayoutAccountDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }
}
