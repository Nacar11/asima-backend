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
import { SellerPayoutsService } from './seller-payouts.service';
import { CreateSellerPayoutDto } from './dto/create-seller-payout.dto';
import { UpdateSellerPayoutDto } from './dto/update-seller-payout.dto';
import { QuerySellerPayoutDto } from './dto/query-seller-payout.dto';
import { SellerPayout } from './domain/seller-payout';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Payouts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-payouts',
  version: '1',
})
export class SellerPayoutsController {
  constructor(private readonly service: SellerPayoutsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: SellerPayout,
    description: 'Seller payout created successfully',
  })
  create(@Body() dto: CreateSellerPayoutDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOkResponse({
    type: SellerPayout,
    isArray: true,
    description: 'List of seller payouts',
  })
  findAll(@Query() query: QuerySellerPayoutDto, @CurrentUser() user: User) {
    return this.service.findAll(query, user);
  }

  @Get('seller/:sellerId')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    type: SellerPayout,
    isArray: true,
    description: 'Seller payouts for a specific seller',
  })
  findBySellerId(
    @Param('sellerId') sellerId: number,
    @CurrentUser() user: User,
  ) {
    return this.service.findBySellerId(sellerId, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerPayout,
    description: 'Seller payout details',
  })
  findById(@Param('id') id: number, @CurrentUser() user: User) {
    return this.service.findById(id, user);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerPayout,
    description: 'Seller payout updated successfully',
  })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerPayoutDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }
}
