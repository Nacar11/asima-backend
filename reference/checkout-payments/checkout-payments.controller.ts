import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { CheckoutPaymentsService } from './checkout-payments.service';
import { CreateCheckoutPaymentDto } from './dto/create-checkout-payment.dto';
import { CreateMembershipCheckoutPaymentDto } from './dto/create-membership-checkout-payment.dto';
import { InitiateMembershipPaymentResponseDto } from './dto/initiate-membership-payment-response.dto';
import { CreateSubscriptionCheckoutPaymentDto } from './dto/create-subscription-checkout-payment.dto';
import { InitiateSubscriptionPaymentResponseDto } from './dto/initiate-subscription-payment-response.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { QueryCheckoutPaymentDto } from './dto/query-checkout-payment.dto';
import { UpdatePaymentGatewaySettingsDto } from './dto/update-payment-gateway-settings.dto';
import { CheckoutPayment } from './domain/checkout-payment';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Public } from '@/utils/decorators/public.decorator';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { User } from '@/users/domain/user';
import { PaymentGatewaySettingsService } from '@/checkout-payments/payment-gateway-settings.service';
import { CreateCustomPaymentMethodDto } from './dto/create-custom-payment-method.dto';
import { UpdateCustomPaymentMethodDto } from './dto/update-custom-payment-method.dto';
import { CustomPaymentMethodRepository } from './persistence/repositories/custom-payment-method.repository';

@ApiTags('Checkout Payments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'checkout-payments',
  version: '1',
})
export class CheckoutPaymentsController {
  constructor(
    private readonly service: CheckoutPaymentsService,
    private readonly gatewaySettingsService: PaymentGatewaySettingsService,
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
  ) {}

  @Post('initiate')
  @ApiCreatedResponse({
    type: CheckoutPayment,
    description: 'Payment initiated successfully',
  })
  initiatePayment(
    @Body() dto: CreateCheckoutPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.initiatePayment(dto, user);
  }

  @Post('initiate-membership')
  @ApiCreatedResponse({
    type: InitiateMembershipPaymentResponseDto,
    description: 'Membership payment initiated successfully',
  })
  initiateMembershipPayment(
    @Body() dto: CreateMembershipCheckoutPaymentDto,
    @CurrentUser() user: User,
  ): Promise<InitiateMembershipPaymentResponseDto> {
    return this.service.initiatePaymentForMembership(dto, user);
  }

  @Post('initiate-subscription')
  @ApiCreatedResponse({
    type: InitiateSubscriptionPaymentResponseDto,
    description: 'Merchant subscription payment initiated successfully',
  })
  initiateSubscriptionPayment(
    @Body() dto: CreateSubscriptionCheckoutPaymentDto,
    @CurrentUser() user: User,
  ): Promise<InitiateSubscriptionPaymentResponseDto> {
    return this.service.initiatePaymentForSubscription(dto, user);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CheckoutPayment,
    description: 'Webhook processed successfully',
  })
  handleWebhook(@Body() dto: ProcessPaymentDto) {
    // Note: In production, this should verify webhook signature
    // and may need to be unauthenticated or use a different auth method
    return this.service.handlePaymentCallback(dto);
  }

  @Get()
  @ApiOkResponse({
    type: CheckoutPayment,
    isArray: true,
    description: 'List of checkout payments',
  })
  findAll(@Query() query: QueryCheckoutPaymentDto, @CurrentUser() user: User) {
    return this.service.findAll(query, user);
  }

  /**
   * Poll payment status by transaction number (txnid).
   *
   * Used by the mobile app after a non-COD checkout to poll for payment
   * completion without needing an order ID (Amazon model: no order exists
   * until the Maya webhook fires and creates it).
   *
   * GET /checkout-payments/status-by-txnid?txnid=PAY-XXX
   *
   * Response:
   *   { status: 'awaiting_payment' | 'paid' | 'failed', order_ids: number[] }
   *
   * `order_ids` is populated once the webhook fires and orders are created.
   * The mobile app uses it to navigate to the order detail page on success.
   */
  @Get('status-by-txnid')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['awaiting_payment', 'paid', 'failed'],
        },
        order_ids: { type: 'array', items: { type: 'number' } },
      },
    },
    description: 'Poll payment status by transaction number',
  })
  async getStatusByTxnid(@Query('txnid') txnid: string) {
    if (!txnid) {
      throw new BadRequestException('txnid query parameter is required');
    }
    return this.service.getPaymentStatusByTxnid(txnid);
  }

  @Get('gateway-settings')
  @ApiOperation({ summary: 'Get current payment gateway settings' })
  async getGatewaySettings() {
    return this.gatewaySettingsService.getSettings();
  }

  @Patch('gateway-settings')
  @ApiOperation({ summary: 'Update payment gateway settings' })
  async updateGatewaySettings(@Body() dto: UpdatePaymentGatewaySettingsDto) {
    return this.gatewaySettingsService.updateSettings(dto);
  }

  @Get('available-methods')
  @Public()
  @ApiOperation({ summary: 'Get enabled payment methods (public)' })
  async getAvailableMethods() {
    return this.gatewaySettingsService.getAvailableMethods();
  }

  @Get('custom-methods')
  @ApiOperation({ summary: 'List all custom payment methods (admin)' })
  listCustomMethods() {
    return this.customPaymentMethodRepository.findAll();
  }

  @Post('custom-methods')
  @ApiOperation({ summary: 'Create a custom payment method' })
  @ApiCreatedResponse({ description: 'Custom payment method created' })
  createCustomMethod(@Body() dto: CreateCustomPaymentMethodDto) {
    return this.customPaymentMethodRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      icon_url: dto.icon_url ?? null,
      qr_image_url: dto.qr_image_url ?? null,
      is_enabled: dto.is_enabled ?? true,
      sort_order: dto.sort_order ?? 100,
    });
  }

  @Patch('custom-methods/:id')
  @ApiOperation({ summary: 'Update a custom payment method' })
  @ApiParam({ name: 'id', type: Number })
  async updateCustomMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomPaymentMethodDto,
  ) {
    const updated = await this.customPaymentMethodRepository.update(id, dto);
    if (!updated)
      throw new NotFoundException(`Custom payment method ${id} not found`);
    return updated;
  }

  @Delete('custom-methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom payment method' })
  @ApiParam({ name: 'id', type: Number })
  async deleteCustomMethod(@Param('id', ParseIntPipe) id: number) {
    const existing = await this.customPaymentMethodRepository.findById(id);
    if (!existing)
      throw new NotFoundException(`Custom payment method ${id} not found`);
    if (existing.is_builtin)
      throw new BadRequestException(
        `Built-in payment method cannot be deleted`,
      );
    await this.customPaymentMethodRepository.softDelete(id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: CheckoutPayment,
    description: 'Payment details',
  })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.service.findById(id, user);
  }

  @Get(':id/status')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        status: { type: 'string' },
        transaction_number: { type: 'string' },
        gateway_checkout_url: { type: 'string', nullable: true },
      },
    },
    description: 'Payment status',
  })
  async getStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const payment = await this.service.findById(id, user);
    return {
      id: payment.id,
      status: payment.status,
      transaction_number: payment.transaction_number,
      gateway_checkout_url: payment.gateway_checkout_url,
    };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: CheckoutPayment,
    description: 'Refund processed successfully',
  })
  processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: User,
  ) {
    return this.service.processRefund(id, dto.amount, dto.reason, user);
  }

  @Patch(':id/confirm-manual')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'Confirm a manual GCash payment (seller/owner action)',
  })
  @ApiOkResponse({ type: CheckoutPayment })
  confirmManualPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.service.confirmManualPayment(id, user);
  }

  @Patch(':id/reject-manual')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'Reject a manual GCash payment (seller/owner action)',
  })
  @ApiOkResponse({ type: CheckoutPayment })
  rejectManualPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason: string },
    @CurrentUser() user: User,
  ) {
    return this.service.rejectManualPayment(id, user, dto.reason ?? '');
  }
}
