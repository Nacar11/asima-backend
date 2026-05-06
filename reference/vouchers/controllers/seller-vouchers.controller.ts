import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { VouchersService } from '@/vouchers/vouchers.service';
import { Voucher } from '@/vouchers/domain/voucher';
import { FindAllVoucher } from '@/vouchers/domain/find-all-voucher';
import { CreateSellerVoucherDto } from '@/vouchers/dto/create-seller-voucher.dto';
import { UpdateSellerVoucherDto } from '@/vouchers/dto/update-seller-voucher.dto';
import { QuerySellerVoucherDto } from '@/vouchers/dto/query-seller-voucher.dto';
import { UpdateVoucherStatusDto } from '@/vouchers/dto/update-voucher-status.dto';
import { GiftVoucherToUsersDto } from '@/vouchers/dto/gift-voucher-to-users.dto';
import { ScanVoucherDto } from '@/vouchers/dto/scan-voucher.dto';
import { RedeemOnsiteDto } from '@/vouchers/dto/redeem-onsite.dto';
import { UserVoucher } from '@/vouchers/domain/user-voucher';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

/**
 * Seller voucher management endpoints.
 */
@ApiTags('Seller - Vouchers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'sellers/vouchers',
  version: '1',
})
export class SellerVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate scanned QR token or shortcode (pre-redemption preview)',
  })
  @ApiBody({ type: ScanVoucherDto })
  @ApiResponse({ status: 200, type: UserVoucher })
  public scanVoucher(
    @Body() input: ScanVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserVoucher> {
    return this.vouchersService.scanVoucherQr(input, currentUser);
  }
  @Post('redeem-onsite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm onsite voucher redemption after scanning',
  })
  @ApiBody({ type: RedeemOnsiteDto })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  public redeemOnsite(
    @Body() input: RedeemOnsiteDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ message: string }> {
    return this.vouchersService.redeemOnsiteVoucher(input, currentUser);
  }
  @Post()
  @ApiOperation({ summary: 'Create seller voucher' })
  @ApiBody({
    type: CreateSellerVoucherDto,
    examples: {
      sellerProductsPercentageVoucher: {
        summary: 'Seller voucher for products scope',
        value: {
          code: 'SELLER50',
          scope: 'products',
          product_ids: [101, 102],
          discount_type: 'percentage',
          discount_value: 10,
          max_discount_cap: 50,
          min_order_amount: 0,
          total_limit: 1000,
          per_user_limit: 1,
          starts_at: '2026-02-18T02:45:14.891Z',
          expires_at: '2026-03-18T02:45:14.891Z',
          status: 'active',
          is_claimable: false,
          description: '10% off selected products, max 50',
          terms_and_conditions: 'Valid for configured products only',
        },
      },
      sellerCategoriesPercentageVoucher: {
        summary: 'Seller voucher for categories scope',
        value: {
          code: 'SELLCAT10',
          scope: 'categories',
          category_ids: [12, 13],
          discount_type: 'percentage',
          discount_value: 10,
          max_discount_cap: 100,
          min_order_amount: 0,
          total_limit: 500,
          per_user_limit: 1,
          starts_at: '2026-02-18T02:45:14.891Z',
          expires_at: '2026-03-18T02:45:14.891Z',
          status: 'active',
          is_claimable: false,
          description: '10% off selected categories, max 100',
          terms_and_conditions: 'Valid for configured categories only',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: Voucher })
  public create(
    @Body() input: CreateSellerVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<Voucher> {
    return this.vouchersService.createSellerVoucher(input, currentUser);
  }
  @Get()
  @ApiOperation({ summary: 'List seller vouchers' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  public findAll(
    @Query() query: QuerySellerVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllVoucher> {
    return this.vouchersService.findAllForSeller(query, currentUser);
  }
  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Voucher })
  public findById(@Param('id', ParseIntPipe) id: number): Promise<Voucher> {
    return this.vouchersService.findById(id);
  }
  @Patch(':id/gift')
  @ApiOperation({
    summary: 'Gift voucher to users (auto-collect for specific users)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: GiftVoucherToUsersDto })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: { collected_count: { type: 'number' } },
    },
  })
  public giftToUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: GiftVoucherToUsersDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ collected_count: number }> {
    return this.vouchersService.giftVoucherToUsers(id, input, currentUser);
  }
  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    type: UpdateSellerVoucherDto,
    examples: {
      sellerUpdateProductsVoucher: {
        summary: 'Update seller voucher with valid seller scope',
        value: {
          scope: 'products',
          product_ids: [101, 102],
          discount_type: 'percentage',
          discount_value: 12,
          max_discount_cap: 50,
          min_order_amount: 200,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: Voucher })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateSellerVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<Voucher> {
    return this.vouchersService.updateVoucher(id, input, currentUser);
  }
  @Patch(':id/status')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Voucher })
  public updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateVoucherStatusDto,
    @CurrentUser() currentUser: User,
  ): Promise<Voucher> {
    return this.vouchersService.updateVoucherStatus(
      id,
      input.status,
      currentUser,
    );
  }
  @Delete(':id(\\d+)')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  public remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.vouchersService.deleteSellerVoucher(id, currentUser);
  }
}
