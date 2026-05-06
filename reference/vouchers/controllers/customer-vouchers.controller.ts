import {
  Body,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { VouchersService } from '@/vouchers/vouchers.service';
import { UserVoucher } from '@/vouchers/domain/user-voucher';
import { GroupedUserVoucher } from '@/vouchers/domain/grouped-user-voucher';
import { FindAllVoucher } from '@/vouchers/domain/find-all-voucher';
import { Voucher } from '@/vouchers/domain/voucher';
import { QueryVoucherDto } from '@/vouchers/dto/query-voucher.dto';
import { QueryMyVouchersDto } from '@/vouchers/dto/query-my-vouchers.dto';
import { CollectVoucherByCodeDto } from '@/vouchers/dto/collect-voucher-by-code.dto';
import { PreviewBookingDiscountDto } from '@/vouchers/dto/preview-booking-discount.dto';
import { GenerateQrTokenResponseDto } from '@/vouchers/dto/generate-qr-token-response.dto';

/**
 * Customer voucher endpoints.
 */
@ApiTags('Vouchers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'vouchers',
  version: '1',
})
export class CustomerVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}
  @Get('my-vouchers')
  @ApiOperation({ summary: 'List customer collected vouchers' })
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
  public findMyVouchers(
    @Query() query: QueryMyVouchersDto,
    @CurrentUser() currentUser: User,
  ): Promise<{
    data: UserVoucher[] | GroupedUserVoucher[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    return this.vouchersService.findMyVouchers(query, currentUser);
  }
  @Get('my-vouchers/summary')
  @ApiOperation({
    summary:
      'Get user vouchers grouped by type with available/used/expired counts',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          voucher_id: { type: 'number' },
          voucher_code: { type: 'string' },
          voucher_description: { type: 'string', nullable: true },
          available_count: { type: 'number' },
          used_count: { type: 'number' },
          expired_count: { type: 'number' },
        },
      },
    },
  })
  public findMyVouchersSummary(@CurrentUser() currentUser: User): Promise<
    Array<{
      voucher_id: number;
      voucher_code: string;
      voucher_description: string | null;
      available_count: number;
      used_count: number;
      expired_count: number;
    }>
  > {
    return this.vouchersService.findMyVouchersSummary(currentUser);
  }
  @Post('my-vouchers/:userVoucherId([0-9]+)/qr')
  @ApiOperation({
    summary:
      'Generate a short-lived QR token for onsite redemption (valid 5 minutes)',
  })
  @ApiResponse({ status: 201, type: GenerateQrTokenResponseDto })
  public generateQrToken(
    @Param('userVoucherId', ParseIntPipe) userVoucherId: number,
    @CurrentUser() currentUser: User,
  ): Promise<GenerateQrTokenResponseDto> {
    return this.vouchersService.generateQrToken(userVoucherId, currentUser);
  }
  @Get('my-vouchers/:id([0-9]+)')
  @ApiOperation({
    summary: 'Get a specific collected voucher by ID with full details',
  })
  @ApiResponse({ status: 200, type: UserVoucher })
  public findMyVoucherById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<UserVoucher> {
    return this.vouchersService.findMyVoucherById(id, currentUser);
  }
  @Get('available')
  @ApiOperation({ summary: 'List publicly available claimable vouchers' })
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
  public findAvailable(
    @Query() query: QueryVoucherDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllVoucher> {
    return this.vouchersService.findAvailableVouchers(query, currentUser);
  }
  @Post('collect/:id([0-9]+)')
  @ApiOperation({ summary: 'Collect a claimable voucher' })
  @ApiResponse({ status: 201, type: UserVoucher })
  public collectVoucher(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<UserVoucher> {
    return this.vouchersService.collectVoucher(id, currentUser);
  }
  @Post('collect/code')
  @ApiOperation({
    summary: 'Collect a claimable voucher by exact voucher code',
  })
  @ApiBody({ type: CollectVoucherByCodeDto })
  @ApiResponse({ status: 201, type: UserVoucher })
  public collectVoucherByCode(
    @Body() input: CollectVoucherByCodeDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserVoucher> {
    return this.vouchersService.collectVoucherByCode(input, currentUser);
  }
  @Get('validate')
  @ApiOperation({
    summary:
      'Evaluate eligibility of all claimed vouchers against selected cart items',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          is_elligible: { type: 'boolean', example: true },
          voucher_id: { type: 'number', example: 1 },
          message: { type: 'string', example: 'Voucher is valid' },
          voucher: { type: 'object' },
        },
      },
    },
  })
  public validateVouchers(@CurrentUser() currentUser: User): Promise<
    Array<{
      is_elligible: boolean;
      voucher_id: number;
      message: string;
      voucher?: Voucher;
    }>
  > {
    return this.vouchersService.validateMyVouchers(currentUser);
  }

  @Get('applicable-for-booking')
  @ApiOperation({
    summary: 'List vouchers applicable for a service booking',
    description:
      "Returns the current user's vouchers that are valid for the given service and subtotal (Travajo booking).",
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_voucher_id: { type: 'number' },
          code: { type: 'string' },
          description: { type: 'string', nullable: true },
          discount_type: { type: 'string' },
          discount_value: { type: 'number' },
          discount_amount: { type: 'number' },
          voucher: { type: 'object' },
        },
      },
    },
  })
  public getApplicableForBooking(
    @Query('service_id', ParseIntPipe) serviceId: number,
    @Query('subtotal', ParseFloatPipe) subtotal: number,
    @Query('num_slots') rawNumSlots?: string,
    @CurrentUser() currentUser?: User,
  ): Promise<
    Array<{
      user_voucher_id: number;
      code: string;
      description: string | null;
      discount_type: string;
      discount_value: number;
      discount_amount: number;
      voucher: Voucher;
    }>
  > {
    const numSlots =
      rawNumSlots !== undefined ? parseInt(rawNumSlots, 10) : undefined;
    return this.vouchersService.getApplicableVouchersForBooking(
      serviceId,
      subtotal,
      currentUser!.id,
      numSlots,
    );
  }

  @Post('preview-booking-discount')
  @ApiOperation({
    summary: 'Preview voucher discount for a booking',
    description:
      'Returns total discount, per-voucher breakdown, and new total. Does not redeem vouchers.',
  })
  @ApiBody({ type: PreviewBookingDiscountDto })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        total_discount: { type: 'number' },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              discount: { type: 'number' },
            },
          },
        },
        new_total: { type: 'number' },
      },
    },
  })
  public previewBookingDiscount(
    @Body() input: PreviewBookingDiscountDto,
    @CurrentUser() currentUser: User,
  ): Promise<{
    total_discount: number;
    breakdown: Array<{ code: string; discount: number; include_addons_flag: boolean }>;
    new_total: number;
  }> {
    return this.vouchersService.previewBookingDiscount(
      input.voucher_codes,
      input.service_id,
      input.subtotal,
      currentUser.id,
      input.num_slots,
      input.addons_total,
    );
  }
}
