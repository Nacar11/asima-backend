import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PickleballMerchantApplicationsService } from '@/pickleball-merchants/pickleball-merchant-applications.service';
import { PickleballMerchantApplicationListItemDto } from '@/pickleball-merchants/dto/pickleball-merchant-application-list-item.dto';
import { PickleballMerchantApplicationDetailDto } from '@/pickleball-merchants/dto/pickleball-merchant-application-detail.dto';
import { ApprovePickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/approve-pickleball-merchant-application.dto';
import { RejectPickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/reject-pickleball-merchant-application.dto';
import { RejectPickleballMerchantSubscriptionPaymentDto } from '@/pickleball-merchants/dto/reject-pickleball-merchant-subscription-payment.dto';
import { SystemAdmin } from '@/users/users.decorator';
import { SystemAdminGuard } from '@/users/user.guard';

@ApiTags('Admin - Pickleball Merchant Applications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({ path: 'admin/pickleball-merchant-applications', version: '1' })
export class AdminPickleballMerchantApplicationsController {
  constructor(
    private readonly pickleballMerchantApplicationsService: PickleballMerchantApplicationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List pickleball merchant applications' })
  @ApiOkResponse({ type: [PickleballMerchantApplicationListItemDto] })
  async findAll(): Promise<PickleballMerchantApplicationListItemDto[]> {
    return this.pickleballMerchantApplicationsService.findAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pickleball merchant application details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.findOneForAdmin(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pickleball merchant application' })
  @ApiParam({ name: 'id', type: Number })
  @ApiCreatedResponse({ type: PickleballMerchantApplicationDetailDto })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApprovePickleballMerchantApplicationDto,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.approveApplication(
      id,
      dto,
      currentUser,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pickleball merchant application' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPickleballMerchantApplicationDto,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.rejectApplication(
      id,
      dto,
      currentUser,
    );
  }

  @Post(':id/approve-subscription-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a submitted merchant subscription payment',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async approveSubscriptionPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.approveSubmittedSubscriptionPayment(
      id,
      currentUser,
    );
  }

  @Post(':id/reject-subscription-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a submitted merchant subscription payment',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async rejectSubscriptionPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPickleballMerchantSubscriptionPaymentDto,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.rejectSubmittedSubscriptionPayment(
      id,
      dto,
      currentUser,
    );
  }

  @Post(':id/mark-onboarding-in-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark merchant onboarding as in progress' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async markOnboardingInProgress(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.markOnboardingInProgress(
      id,
    );
  }

  @Post(':id/mark-onboarding-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark merchant onboarding as complete' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async markOnboardingComplete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.markOnboardingComplete(
      id,
      currentUser,
    );
  }
}
