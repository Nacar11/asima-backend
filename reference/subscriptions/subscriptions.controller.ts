import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from '@/subscriptions/domain/subscription';
import { SubscriptionUsage } from '@/subscriptions/domain/subscription-usage';
import { CreateSubscriptionDto } from '@/subscriptions/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '@/subscriptions/dto/update-subscription.dto';
import { QuerySubscriptionDto } from '@/subscriptions/dto/query-subscription.dto';
import { CancelSubscriptionDto } from '@/subscriptions/dto/cancel-subscription.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import {
  PaginatedResponse,
  PaginatedResponseDto,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'subscriptions',
  version: '1',
})
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('/subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiCreatedResponse({ type: Subscription })
  subscribe(
    @Body() createDto: CreateSubscriptionDto,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.subscribe(createDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions with pagination (Admin)' })
  @ApiOkResponse({ type: PaginatedResponse(Subscription) })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  async findAll(
    @Query() query: QuerySubscriptionDto,
  ): Promise<PaginatedResponseDto<Subscription>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const results =
      await this.subscriptionsService.findAllWithPagination(query);
    return paginate(results, { page, limit });
  }

  @Get('/my-subscription')
  @ApiOperation({ summary: 'Get my current active subscription' })
  @ApiOkResponse({ type: Subscription })
  findMySubscription(
    @CurrentUser() currentUser: User,
  ): Promise<Subscription | null> {
    return this.subscriptionsService.findMySubscription(currentUser.id);
  }

  @Get('/my-history')
  @ApiOperation({ summary: 'Get my subscription history' })
  @ApiOkResponse({ type: [Subscription] })
  findMyHistory(@CurrentUser() currentUser: User): Promise<Subscription[]> {
    return this.subscriptionsService.findByUserId(currentUser.id);
  }

  @Get('/usage')
  @ApiOperation({
    summary: 'Get subscription usage stats',
    description:
      'Returns current usage vs plan limits for the authenticated user. Shows how much of their subscription quota they have consumed.',
  })
  @ApiOkResponse({
    type: SubscriptionUsage,
    description: 'Subscription usage statistics',
  })
  getUsage(@CurrentUser() currentUser: User): Promise<SubscriptionUsage> {
    return this.subscriptionsService.getUsage(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  findById(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.findByIdForUser(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  update(
    @Param('id') id: number,
    @Body() updateDto: UpdateSubscriptionDto,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.update(id, updateDto, currentUser);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  cancel(
    @Param('id') id: number,
    @Body() cancelDto: CancelSubscriptionDto,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.cancelForUser(id, cancelDto, currentUser);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew subscription' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  renew(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.renewForUser(id, currentUser);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate subscription after payment (Admin)' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  activate(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.activate(id, currentUser);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend subscription (Admin)' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Subscription })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  suspend(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Subscription> {
    return this.subscriptionsService.suspend(id, currentUser);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete subscriptions' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Subscriptions deleted successfully' })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  async bulkDelete(
    @Body() bulkDeleteDto: BulkActionDto,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.subscriptionsService.bulkDelete(bulkDeleteDto.ids, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Subscription deleted' })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  async remove(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.subscriptionsService.remove(id, currentUser);
  }
}
