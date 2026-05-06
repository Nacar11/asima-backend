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
import { SellerEarningsService } from './seller-earnings.service';
import { CreateSellerEarningDto } from './dto/create-seller-earning.dto';
import { UpdateSellerEarningDto } from './dto/update-seller-earning.dto';
import { QuerySellerEarningDto } from './dto/query-seller-earning.dto';
import { SellerEarning } from './domain/seller-earning';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Earnings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-earnings',
  version: '1',
})
export class SellerEarningsController {
  constructor(private readonly service: SellerEarningsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: SellerEarning,
    description: 'Seller earning created successfully',
  })
  create(@Body() dto: CreateSellerEarningDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOkResponse({
    type: SellerEarning,
    isArray: true,
    description: 'List of seller earnings',
  })
  findAll(@Query() query: QuerySellerEarningDto) {
    return this.service.findAll(query);
  }

  @Get('seller/:sellerId')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    type: SellerEarning,
    isArray: true,
    description: 'Seller earnings for a specific seller',
  })
  findBySellerId(
    @Param('sellerId') sellerId: number,
    @Query('status') status?: string,
  ) {
    return this.service.findBySellerId(sellerId, status);
  }

  @Get('seller/:sellerId/summary')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    description: 'Earnings summary for a seller',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number' },
        available: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  getEarningsSummary(@Param('sellerId') sellerId: number) {
    return this.service.getEarningsSummary(sellerId);
  }

  @Get('seller/:sellerId/dashboard')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    description: 'Enhanced earnings dashboard for a seller with chart data',
    schema: {
      type: 'object',
      properties: {
        total_earnings: { type: 'number' },
        available_balance: { type: 'number' },
        pending_balance: { type: 'number' },
        this_month_earnings: { type: 'number' },
        last_month_earnings: { type: 'number' },
        chart: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  getEarningsDashboard(@Param('sellerId') sellerId: number) {
    return this.service.getEnhancedEarningsSummary(sellerId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerEarning,
    description: 'Seller earning details',
  })
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: SellerEarning,
    description: 'Seller earning updated successfully',
  })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerEarningDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }
}
