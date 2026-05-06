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
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MembershipsService } from '@/memberships/memberships.service';
import { QueryMembershipDto } from '@/memberships/dto/query-membership.dto';
import { FindAllMembership } from '@/memberships/domain/find-all-membership';
import { Membership } from '@/memberships/domain/membership';
import { ExtendMembershipDto } from '@/memberships/dto/extend-membership.dto';
import { CancelMembershipDto } from '@/memberships/dto/cancel-membership.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { QueryMembershipPaymentDto } from '@/memberships/dto/query-membership-payment.dto';
import { FindAllMembershipPayment } from '@/memberships/domain/find-all-membership-payment';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { QueryMembershipVoucherGrantDto } from '@/memberships/dto/query-membership-voucher-grant.dto';
import { FindAllMembershipVoucherGrant } from '@/memberships/domain/find-all-membership-voucher-grant';
import { MembershipDetails } from '@/memberships/domain/membership-details';

@ApiTags('Admin - Memberships')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'admin/memberships', version: '1' })
export class AdminMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}
  /**
   * List memberships.
   */
  @Get()
  @ApiOperation({ summary: 'List memberships' })
  @ApiOkResponse({ type: Object })
  findAll(@Query() query: QueryMembershipDto): Promise<FindAllMembership> {
    return this.membershipsService.findAll(query);
  }
  /**
   * Get membership by identifier.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get membership by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MembershipDetails })
  findById(@Param('id', ParseIntPipe) id: number): Promise<MembershipDetails> {
    return this.membershipsService.findMembershipDetailsById(id);
  }
  /**
   * Extend membership.
   */
  @Post(':id/extend')
  @ApiOperation({ summary: 'Extend membership end date' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ExtendMembershipDto })
  @ApiOkResponse({ type: Membership })
  extend(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ExtendMembershipDto,
    @CurrentUser() currentUser: User,
  ): Promise<Membership> {
    return this.membershipsService.extendMembership(id, input, currentUser);
  }
  /**
   * Cancel membership.
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel membership' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CancelMembershipDto })
  @ApiOkResponse({ type: Membership })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CancelMembershipDto,
    @CurrentUser() currentUser: User,
  ): Promise<Membership> {
    return this.membershipsService.cancelMembership(id, input, currentUser);
  }
  /**
   * List membership payments.
   */
  @Get(':id/payments')
  @ApiOperation({ summary: 'List membership payments' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  findPayments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment> {
    return this.membershipsService.findPayments({
      ...query,
      membership_id: id,
    });
  }
  /**
   * List membership voucher grants.
   */
  @Get(':id/voucher-grants')
  @ApiOperation({ summary: 'List membership voucher grants' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  findVoucherGrants(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryMembershipVoucherGrantDto,
  ): Promise<FindAllMembershipVoucherGrant> {
    return this.membershipsService.findVoucherGrants({
      ...query,
      membership_id: id,
    });
  }
  /**
   * List all membership payments across all memberships (admin review queue).
   */
  @Get('payments')
  @ApiOperation({ summary: 'List all membership payments (admin)' })
  @ApiOkResponse({ type: Object })
  findAllPayments(
    @Query() query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment> {
    return this.membershipsService.findPayments(query);
  }

  /**
   * Get a single membership payment by id (includes payment_proof_url).
   */
  @Get('payments/:id')
  @ApiOperation({ summary: 'Get membership payment by id (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  findPaymentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MembershipPayment> {
    return this.membershipsService.getPaymentById(id);
  }

  /**
   * Admin: confirm pending QR payment and activate membership.
   */
  @Patch('payments/:id/confirm')
  @ApiOperation({ summary: 'Admin confirm membership QR payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<{ membership_payment_id: number; message: string }> {
    return this.membershipsService.adminConfirmMembershipPayment(
      id,
      currentUser,
    );
  }

  /**
   * Admin: void a pending payment (cancelled before confirmation).
   */
  @Patch('payments/:id/void')
  @ApiOperation({ summary: 'Admin void a pending membership payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  voidPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<{ membership_payment_id: number; message: string }> {
    return this.membershipsService.adminVoidMembershipPayment(id, currentUser);
  }

  /**
   * Remove membership.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete membership' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.membershipsService.removeMembership(id, currentUser);
  }
}
