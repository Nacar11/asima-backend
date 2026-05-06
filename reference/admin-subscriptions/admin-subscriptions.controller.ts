import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AdminSubscriptionsService } from '@/admin-subscriptions/admin-subscriptions.service';
import { SubscriptionOverview } from '@/admin-subscriptions/domain/subscription-overview';
import { SubscriptionOperation } from '@/admin-subscriptions/domain/subscription-operation';
import { UpcomingRenewal } from '@/admin-subscriptions/domain/upcoming-renewal';
import { FailedPayment } from '@/admin-subscriptions/domain/failed-payment';
import { QuickStats } from '@/admin-subscriptions/domain/quick-stats';
import { Subscription } from '@/subscriptions/domain/subscription';
import { ManualRenewalDto } from '@/admin-subscriptions/dto/manual-renewal.dto';
import { ExtendSubscriptionDto } from '@/admin-subscriptions/dto/extend-subscription.dto';
import { RetryPaymentDto } from '@/admin-subscriptions/dto/retry-payment.dto';
import { BulkActionDto } from '@/admin-subscriptions/dto/bulk-action.dto';
import { AdminCreateSubscriptionDto } from '@/admin-subscriptions/dto/admin-create-subscription.dto';
import { AdminBulkCreateSubscriptionDto } from '@/admin-subscriptions/dto/admin-bulk-create-subscription.dto';
import { QueryOperationsDto } from '@/admin-subscriptions/dto/query-operations.dto';
import { QueryAnalyticsDto } from '@/admin-subscriptions/dto/query-analytics.dto';
import { QueryUpcomingRenewalsDto } from '@/admin-subscriptions/dto/query-upcoming-renewals.dto';
import { QueryFailedPaymentsDto } from '@/admin-subscriptions/dto/query-failed-payments.dto';
import { UpgradePlanDto } from '@/admin-subscriptions/dto/upgrade-plan.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { SystemAdmin } from '@/users/users.decorator';
import { SystemAdminGuard } from '@/users/user.guard';

/**
 * Admin Subscriptions Controller.
 *
 * Handles HTTP endpoints for admin subscription management.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Admin - Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/subscriptions',
  version: '1',
})
export class AdminSubscriptionsController {
  constructor(
    private readonly adminSubscriptionsService: AdminSubscriptionsService,
  ) {}

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get subscription by user ID',
    description:
      'Returns the active subscription for a specific user (Admin only)',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'User subscription retrieved successfully',
  })
  async getSubscriptionByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Subscription | null> {
    return this.adminSubscriptionsService.getSubscriptionByUserId(userId);
  }

  @Get('user/:userId/history')
  @ApiOperation({
    summary: 'Get all subscriptions by user ID',
    description: 'Returns all subscriptions for a specific user (Admin only)',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
  })
  @ApiOkResponse({
    type: [Subscription],
    description: 'User subscriptions retrieved successfully',
  })
  async getSubscriptionsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Subscription[]> {
    return this.adminSubscriptionsService.getSubscriptionsByUserId(userId);
  }

  @Post('create-for-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create subscription for a user',
    description: 'Creates a new subscription for a specific user (Admin only)',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription created successfully',
  })
  async createSubscriptionForUser(
    @Body() dto: AdminCreateSubscriptionDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.createSubscriptionForUser(dto, user);
  }

  @Post('bulk-create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk create subscriptions for multiple users',
    description:
      'Creates subscriptions for multiple users at once (Admin only)',
  })
  @ApiOkResponse({
    description: 'Bulk subscription creation results',
  })
  async bulkCreateSubscriptions(
    @Body() dto: AdminBulkCreateSubscriptionDto,
    @CurrentUser() user: User,
  ): Promise<{
    success: Subscription[];
    failed: { user_id: number; error: string }[];
  }> {
    return this.adminSubscriptionsService.bulkCreateSubscriptions(dto, user);
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Get subscription overview',
    description: 'Returns subscription metrics and overview data (Admin only)',
  })
  @ApiOkResponse({
    type: SubscriptionOverview,
    description: 'Subscription overview retrieved successfully',
  })
  async getOverview(): Promise<SubscriptionOverview> {
    return this.adminSubscriptionsService.getOverview();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get subscription analytics',
    description:
      'Returns subscription analytics including trends, plan popularity, and churn analysis (Admin only)',
  })
  @ApiOkResponse({
    description: 'Subscription analytics retrieved successfully',
  })
  async getAnalytics(@Query() dto: QueryAnalyticsDto) {
    return this.adminSubscriptionsService.getAnalytics(dto);
  }

  @Get('operations')
  @ApiOperation({
    summary: 'Get operations log',
    description:
      'Returns paginated list of subscription operations (Admin only)',
  })
  @ApiOkResponse({
    description: 'Operations log retrieved successfully',
  })
  async getOperationsLog(
    @Query() dto: QueryOperationsDto,
  ): Promise<PaginatedResponseDto<SubscriptionOperation>> {
    const result = await this.adminSubscriptionsService.getOperationsLog(dto);
    return paginate(result, {
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
  }

  @Get('upcoming-renewals')
  @ApiOperation({
    summary: 'Get upcoming renewals list',
    description:
      'Returns paginated list of upcoming subscription renewals with customer details (Admin only)',
  })
  @ApiOkResponse({
    description: 'Upcoming renewals list retrieved successfully',
  })
  async getUpcomingRenewals(
    @Query() dto: QueryUpcomingRenewalsDto,
  ): Promise<PaginatedResponseDto<UpcomingRenewal>> {
    const result =
      await this.adminSubscriptionsService.getUpcomingRenewals(dto);
    return paginate(result, {
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
  }

  @Get('failed-payments')
  @ApiOperation({
    summary: 'Get failed payments list',
    description:
      'Returns paginated list of failed subscription payments with customer details (Admin only)',
  })
  @ApiOkResponse({
    description: 'Failed payments list retrieved successfully',
  })
  async getFailedPayments(
    @Query() dto: QueryFailedPaymentsDto,
  ): Promise<PaginatedResponseDto<FailedPayment>> {
    const result = await this.adminSubscriptionsService.getFailedPayments(dto);
    return paginate(result, {
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
  }

  @Get('quick-stats')
  @ApiOperation({
    summary: 'Get quick stats',
    description:
      'Returns quick statistics for the operations dashboard (Admin only)',
  })
  @ApiOkResponse({
    type: QuickStats,
    description: 'Quick stats retrieved successfully',
  })
  async getQuickStats(): Promise<QuickStats> {
    return this.adminSubscriptionsService.getQuickStats();
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually renew subscription',
    description: 'Manually renews a subscription (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription renewed successfully',
  })
  async manualRenewal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManualRenewalDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.manualRenewal(id, dto, user);
  }

  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extend subscription',
    description:
      'Extends a subscription by specified number of days (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription extended successfully',
  })
  async extendSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExtendSubscriptionDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.extendSubscription(id, dto, user);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry payment',
    description:
      'Retries payment for a subscription with pending payment status (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Payment retry initiated successfully',
  })
  async retryPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetryPaymentDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.retryPayment(id, dto, user);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause subscription',
    description: 'Pauses (suspends) an active subscription (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription paused successfully',
  })
  async pauseSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetryPaymentDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.pauseSubscription(
      id,
      dto.reason,
      user,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Permanently cancels a subscription (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription cancelled successfully',
  })
  async cancelSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetryPaymentDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.cancelSubscription(
      id,
      dto.reason,
      user,
    );
  }

  @Post(':id/upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade subscription plan',
    description: 'Upgrades a subscription to a new plan (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Subscription upgraded successfully',
  })
  async upgradePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpgradePlanDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.upgradePlan(id, dto, user);
  }

  @Post(':id/sync-billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync billing cycle',
    description:
      'Synchronizes billing cycle dates for a subscription (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subscription ID',
  })
  @ApiOkResponse({
    type: Subscription,
    description: 'Billing synchronized successfully',
  })
  async syncBilling(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetryPaymentDto,
    @CurrentUser() user: User,
  ): Promise<Subscription> {
    return this.adminSubscriptionsService.syncBilling(id, dto.reason, user);
  }

  @Post('bulk-action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk subscription operations',
    description:
      'Performs bulk operations on multiple subscriptions (Admin only)',
  })
  @ApiOkResponse({
    type: [Subscription],
    description: 'Bulk operations completed successfully',
  })
  async bulkAction(
    @Body() dto: BulkActionDto,
    @CurrentUser() user: User,
  ): Promise<Subscription[]> {
    return this.adminSubscriptionsService.bulkAction(dto, user);
  }
}
