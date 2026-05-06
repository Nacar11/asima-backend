import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { MembershipsService } from '@/memberships/memberships.service';
import { RegisterMembershipDto } from '@/memberships/dto/register-membership.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { Membership } from '@/memberships/domain/membership';
import { RenewMembershipDto } from '@/memberships/dto/renew-membership.dto';
import { UpdateAutoRenewalDto } from '@/memberships/dto/update-auto-renewal.dto';
import { CancelMembershipDto } from '@/memberships/dto/cancel-membership.dto';
import { QueryMembershipPaymentDto } from '@/memberships/dto/query-membership-payment.dto';
import { FindAllMembershipPayment } from '@/memberships/domain/find-all-membership-payment';
import { ActivateMembershipDto } from '@/memberships/dto/activate-membership.dto';
import { RegisterMembershipResponseDto } from '@/memberships/dto/register-membership-response.dto';
import { ActivateMembershipResponseDto } from '@/memberships/dto/activate-membership-response.dto';
import { MyMembershipResponseDto } from '@/memberships/dto/my-membership-response.dto';
import { MembershipSettingsResponseDto } from '@/memberships/dto/membership-settings-response.dto';
import { UpdateMembershipSettingsDto } from '@/memberships/dto/update-membership-settings.dto';
import { RenewMembershipResponseDto } from '@/memberships/dto/renew-membership-response.dto';
import { MembershipBillingPeriodResponseDto } from '@/memberships/dto/membership-billing-period-response.dto';
import { QueryMembershipPlanBillingPeriodDto } from '@/memberships/dto/query-membership-plan-billing-period.dto';
import { MembershipPaymentPageResponseDto } from '@/memberships/dto/membership-payment-page-response.dto';
import { MembershipPaymentStatusResponseDto } from '@/memberships/dto/membership-payment-status-response.dto';
import { NotifyMembershipPaymentDto } from '@/memberships/dto/notify-membership-payment.dto';
import { SubmitMembershipPaymentDto } from '@/memberships/dto/submit-membership-payment.dto';

@ApiTags('Memberships')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'memberships', version: '1' })
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}
  /**
   * Register membership for authenticated user.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register membership' })
  @ApiBody({ type: RegisterMembershipDto })
  @ApiOkResponse({ type: RegisterMembershipResponseDto })
  register(
    @Body() input: RegisterMembershipDto,
    @CurrentUser() currentUser: User,
  ): Promise<RegisterMembershipResponseDto> {
    return this.membershipsService.registerMembership(input, currentUser);
  }
  /**
   * Update membership settings.
   */
  @Patch('settings')
  @ApiOperation({ summary: 'Update membership settings' })
  @ApiBody({ type: UpdateMembershipSettingsDto })
  @ApiOkResponse({ type: MembershipSettingsResponseDto })
  updateSettings(
    @Body() input: UpdateMembershipSettingsDto,
  ): Promise<MembershipSettingsResponseDto> {
    return this.membershipsService.updateMembershipSettings(input);
  }
  /**
   * Get membership settings.
   */
  @Get('settings')
  @ApiOperation({ summary: 'Get membership settings' })
  @ApiOkResponse({ type: MembershipSettingsResponseDto })
  getSettings(): Promise<MembershipSettingsResponseDto> {
    return this.membershipsService.getMembershipSettings();
  }
  /**
   * Get current user membership.
   */
  @Get('my-membership')
  @ApiOperation({ summary: 'Get current user membership' })
  @ApiExtraModels(MyMembershipResponseDto)
  @ApiOkResponse({
    schema: {
      $ref: getSchemaPath(MyMembershipResponseDto),
    },
  })
  findMyMembership(
    @CurrentUser() currentUser: User,
  ): Promise<MyMembershipResponseDto> {
    return this.membershipsService.findMyMembership(currentUser);
  }
  /**
   * Activate membership.
   */
  @Post('activate')
  @ApiOperation({ summary: 'Activate membership' })
  @ApiBody({ type: ActivateMembershipDto })
  @ApiOkResponse({ type: ActivateMembershipResponseDto })
  activate(
    @Body() input: ActivateMembershipDto,
    @CurrentUser() currentUser: User,
  ): Promise<ActivateMembershipResponseDto> {
    return this.membershipsService.activateMembership(input, currentUser);
  }

  /**
   * Get membership payment page data (QR image, expiry, proof, status).
   */
  @Get('payments/:id/payment-page')
  @ApiOperation({ summary: 'Get membership payment page data' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MembershipPaymentPageResponseDto })
  getMembershipPaymentPage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipPaymentPageResponseDto> {
    return this.membershipsService.getMembershipPaymentPage(id, currentUser);
  }

  /**
   * Poll membership payment status.
   */
  @Get('payments/:id/payment-status')
  @ApiOperation({ summary: 'Poll membership payment status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MembershipPaymentStatusResponseDto })
  getMembershipPaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipPaymentStatusResponseDto> {
    return this.membershipsService.getMembershipPaymentStatus(id, currentUser);
  }

  /**
   * Notify that proof has been uploaded (transitions to awaiting_confirmation).
   */
  @Post('payments/:id/notify-payment')
  @UseInterceptors(FileInterceptor('payment_proof'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Notify membership payment proof upload' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MembershipPaymentStatusResponseDto })
  notifyMembershipPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Body() dto: NotifyMembershipPaymentDto,
    @UploadedFile() proofFile?: Express.Multer.File,
  ): Promise<MembershipPaymentStatusResponseDto> {
    return this.membershipsService.notifyMembershipPayment(
      id,
      currentUser,
      dto,
      proofFile,
    );
  }
  /**
   * Submit payment proof — creates membership + payment in one shot as AWAITING_CONFIRMATION.
   */
  @Post('submit-payment')
  @UseInterceptors(FileInterceptor('payment_proof'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit membership payment proof (QR flow)' })
  @ApiOkResponse({ type: MembershipPaymentStatusResponseDto })
  submitMembershipPayment(
    @CurrentUser() currentUser: User,
    @Body() dto: SubmitMembershipPaymentDto,
    @UploadedFile() proofFile?: Express.Multer.File,
  ): Promise<MembershipPaymentStatusResponseDto> {
    return this.membershipsService.submitMembershipPayment(
      dto,
      currentUser,
      proofFile,
    );
  }

  /**
   * Reactivate a cancelled membership if still within its valid period.
   */
  @Post('reactivate')
  @ApiOperation({
    summary: 'Reactivate cancelled membership within valid period',
  })
  @ApiOkResponse({ type: Object })
  reactivate(@CurrentUser() currentUser: User): Promise<Membership> {
    return this.membershipsService.reactivateMembership(currentUser);
  }

  /**
   * Renew membership.
   */
  @Post('renew')
  @ApiOperation({ summary: 'Renew membership' })
  @ApiBody({ type: RenewMembershipDto })
  @ApiOkResponse({ type: RenewMembershipResponseDto })
  renew(
    @Body() input: RenewMembershipDto,
    @CurrentUser() currentUser: User,
  ): Promise<RenewMembershipResponseDto> {
    return this.membershipsService.renewMembership(input, currentUser);
  }
  /**
   * Update auto-renew status.
   */
  @Patch(':id/auto-renewal')
  @ApiOperation({ summary: 'Update auto-renew status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAutoRenewalDto })
  @ApiOkResponse({ type: Membership })
  updateAutoRenewal(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateAutoRenewalDto,
    @CurrentUser() currentUser: User,
  ): Promise<Membership> {
    return this.membershipsService.updateAutoRenewal(id, input, currentUser);
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
   * Get membership billing periods for user's current plan.
   */
  @Get('plans/:planId/billing-periods')
  @ApiOperation({ summary: 'Get billing periods for membership plan' })
  @ApiParam({ name: 'planId', type: Number })
  @ApiOkResponse({ type: [MembershipBillingPeriodResponseDto] })
  getMembershipBillingPeriodsByPlanId(
    @Param('planId', ParseIntPipe) planId: number,
    @Query() query: QueryMembershipPlanBillingPeriodDto,
  ): Promise<MembershipBillingPeriodResponseDto[]> {
    return this.membershipsService.getMembershipBillingPeriodsByPlanId(
      planId,
      query,
    );
  }

  /**
   * List membership payments.
   */
  @Get(':id/payments')
  @ApiOperation({ summary: 'List membership payments' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Object })
  findMembershipPayments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment> {
    return this.membershipsService.findPayments({
      ...query,
      membership_id: id,
    });
  }
}
