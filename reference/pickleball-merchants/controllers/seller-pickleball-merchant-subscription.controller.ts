import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PickleballMerchantApplicationsService } from '@/pickleball-merchants/pickleball-merchant-applications.service';
import { PickleballMerchantApplicationDetailDto } from '@/pickleball-merchants/dto/pickleball-merchant-application-detail.dto';
import { SubmitPickleballMerchantSubscriptionPaymentDto } from '@/pickleball-merchants/dto/submit-pickleball-merchant-subscription-payment.dto';

@ApiTags('Seller - Pickleball Merchant Subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'seller/merchant-subscription', version: '1' })
export class SellerPickleballMerchantSubscriptionController {
  constructor(
    private readonly pickleballMerchantApplicationsService: PickleballMerchantApplicationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Get the current seller pickleball merchant onboarding/subscription status',
  })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async findCurrent(
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.findOnboardingForUser(
      currentUser,
    );
  }

  @Post('complete-owner-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark owner account setup as completed after first login',
  })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async completeOwnerSetup(
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.completeOwnerSetup(
      currentUser,
    );
  }

  @Post('submit-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit merchant subscription payment proof for admin review',
  })
  @ApiOkResponse({ type: PickleballMerchantApplicationDetailDto })
  async submitPayment(
    @Body() dto: SubmitPickleballMerchantSubscriptionPaymentDto,
    @CurrentUser() currentUser: User,
  ): Promise<PickleballMerchantApplicationDetailDto> {
    return this.pickleballMerchantApplicationsService.submitSubscriptionPayment(
      currentUser,
      dto,
    );
  }
}
