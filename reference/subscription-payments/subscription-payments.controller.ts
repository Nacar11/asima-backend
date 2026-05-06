import {
  Controller,
  Get,
  Post,
  Body,
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
import { SubscriptionPaymentsService } from './subscription-payments.service';
import { SubscriptionPayment } from '@/subscription-payments/domain/subscription-payment';
import { CreateSubscriptionPaymentDto } from '@/subscription-payments/dto/create-subscription-payment.dto';
import { QuerySubscriptionPaymentDto } from '@/subscription-payments/dto/query-subscription-payment.dto';
import { ProcessPaymentDto } from '@/subscription-payments/dto/process-payment.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import {
  PaginatedResponse,
  PaginatedResponseDto,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { SystemAdmin } from '@/users/users.decorator';
import { SystemAdminGuard } from '@/users/user.guard';

@ApiTags('Subscription Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'subscription-payments',
  version: '1',
})
export class SubscriptionPaymentsController {
  constructor(
    private readonly subscriptionPaymentsService: SubscriptionPaymentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a subscription payment' })
  @ApiCreatedResponse({ type: SubscriptionPayment })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  create(
    @Body() createDto: CreateSubscriptionPaymentDto,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment> {
    return this.subscriptionPaymentsService.create(createDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription payments with pagination' })
  @ApiOkResponse({ type: PaginatedResponse(SubscriptionPayment) })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  async findAll(
    @Query() query: QuerySubscriptionPaymentDto,
  ): Promise<PaginatedResponseDto<SubscriptionPayment>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const results =
      await this.subscriptionPaymentsService.findAllWithPagination(query);
    return paginate(results, { page, limit });
  }

  @Get('/subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get payments for a subscription' })
  @ApiParam({ name: 'subscriptionId', type: Number })
  @ApiOkResponse({ type: [SubscriptionPayment] })
  findBySubscriptionId(
    @Param('subscriptionId') subscriptionId: number,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment[]> {
    return this.subscriptionPaymentsService.findBySubscriptionIdForUser(
      subscriptionId,
      currentUser,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription payment by ID' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPayment })
  findById(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment> {
    return this.subscriptionPaymentsService.findByIdForUser(id, currentUser);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process payment (mark as paid)' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPayment })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  processPayment(
    @Param('id') id: number,
    @Body() processDto: ProcessPaymentDto,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment> {
    return this.subscriptionPaymentsService.processPayment(
      id,
      processDto,
      currentUser,
    );
  }

  @Post(':id/fail')
  @ApiOperation({ summary: 'Mark payment as failed' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPayment })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  markAsFailed(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment> {
    return this.subscriptionPaymentsService.markAsFailed(id, currentUser);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SubscriptionPayment })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  refund(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<SubscriptionPayment> {
    return this.subscriptionPaymentsService.refund(id, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription payment' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Subscription payment deleted' })
  @UseGuards(AuthGuard('jwt'), SystemAdminGuard)
  @SystemAdmin(true)
  async remove(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.subscriptionPaymentsService.remove(id, currentUser);
  }
}
