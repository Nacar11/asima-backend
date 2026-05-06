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
import { CreateAdminVoucherDto } from '@/vouchers/dto/create-admin-voucher.dto';
import { UpdateAdminVoucherDto } from '@/vouchers/dto/update-admin-voucher.dto';
import { QueryAdminVoucherDto } from '@/vouchers/dto/query-admin-voucher.dto';
import { UpdateVoucherStatusDto } from '@/vouchers/dto/update-voucher-status.dto';
import { GiftVoucherToUsersDto } from '@/vouchers/dto/gift-voucher-to-users.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

/**
 * Admin voucher management endpoints.
 */
@ApiTags('Admin - Vouchers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'admin/vouchers',
  version: '1',
})
export class AdminVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}
  @Post()
  @ApiOperation({ summary: 'Create admin voucher' })
  @ApiBody({
    type: CreateAdminVoucherDto,
    examples: {
      adminPercentageVoucher: {
        summary: 'Admin percentage voucher (categories scope)',
        value: {
          code: 'WELCOME100',
          scope: 'categories',
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
          description: '10% off, max 50',
          terms_and_conditions: 'Applicable to selected categories',
          category_ids: [1, 2, 3],
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: Voucher })
  public create(
    @Body() input: CreateAdminVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<Voucher> {
    return this.vouchersService.createGlobalVoucher(input, currentUser);
  }
  @Get()
  @ApiOperation({ summary: 'List all vouchers' })
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
    @Query() query: QueryAdminVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllVoucher> {
    return this.vouchersService.findAllForAdmin(query, currentUser);
  }
  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Voucher })
  public findById(@Param('id', ParseIntPipe) id: number): Promise<Voucher> {
    return this.vouchersService.findById(id);
  }
  @Patch(':id/gift')
  @ApiOperation({
    summary: 'Gift admin voucher to users (auto-collect for specific users)',
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
    return this.vouchersService.giftAdminVoucherToUsers(id, input, currentUser);
  }
  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    type: UpdateAdminVoucherDto,
    examples: {
      adminUpdateVoucher: {
        summary: 'Update admin voucher',
        value: {
          discount_type: 'percentage',
          discount_value: 15,
          max_discount_cap: 50,
          min_order_amount: 100,
          expires_at: '2026-03-31T02:45:14.891Z',
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: Voucher })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateAdminVoucherDto,
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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  public remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.vouchersService.deleteVoucher(id, currentUser);
  }
}
