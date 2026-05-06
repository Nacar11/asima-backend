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
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';
import { CreateSubscriptionPlanDto } from '@/subscription-plans/dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '@/subscription-plans/dto/update-subscription-plan.dto';
import { QuerySubscriptionPlanDto } from '@/subscription-plans/dto/query-subscription-plan.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import {
  PaginatedResponse,
  PaginatedResponseDto,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'subscription-plans',
  version: '1',
})
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiCreatedResponse({ type: SubscriptionPlan })
  create(
    @Body() createDto: CreateSubscriptionPlanDto,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionPlansService.create(createDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans with pagination' })
  @ApiOkResponse({ type: PaginatedResponse(SubscriptionPlan) })
  async findAll(
    @Query() query: QuerySubscriptionPlanDto,
  ): Promise<PaginatedResponseDto<SubscriptionPlan>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const results =
      await this.subscriptionPlansService.findAllWithPagination(query);
    return paginate(results, { page, limit });
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiOkResponse({ type: [SubscriptionPlan] })
  findActive(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlansService.findActive();
  }

  @Get('/lookup')
  @ApiOperation({ summary: 'Get subscription plans for lookup dropdown' })
  @ApiOkResponse({
    description: 'Returns a list for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              code: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  lookup(@Query() query: LookUpDto): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    return this.subscriptionPlansService.lookup(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPlan })
  findById(@Param('id') id: number): Promise<SubscriptionPlan> {
    return this.subscriptionPlansService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPlan })
  update(
    @Param('id') id: number,
    @Body() updateDto: UpdateSubscriptionPlanDto,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionPlansService.update(id, updateDto, currentUser);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete subscription plans' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Subscription plans deleted successfully' })
  async bulkDelete(
    @Body() bulkDeleteDto: BulkActionDto,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.subscriptionPlansService.bulkDelete(
      bulkDeleteDto.ids,
      currentUser,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Subscription plan deleted' })
  async remove(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.subscriptionPlansService.remove(id, currentUser);
  }
}
