import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { BaseCheckoutPaymentRepository } from './persistence/base-checkout-payment.repository';
import { CheckoutPayment } from './domain/checkout-payment';
import { CreateCheckoutPaymentDto } from './dto/create-checkout-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { QueryCheckoutPaymentDto } from './dto/query-checkout-payment.dto';
import {
  DragonPayV2CallbackDto,
  DragonPayV2PayoutCallbackDto,
} from './dto/dragonpay-v2';
import { User } from '@/users/domain/user';
import { CheckoutOrdersService } from '@/checkout-orders/checkout-orders.service';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';
import { CheckoutPaymentStatusEnum } from './enums/checkout-payment-status.enum';
import { PayMongoService } from './services/paymongo.service';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { DragonPayV2Service } from './services/dragonpay-v2.service';
import { MayaCheckoutService } from './services/maya-checkout.service';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { PaymentStatusEnum as SalesOrderPaymentStatusEnum } from '@/sales-orders/domain/payment-status.enum';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from '@/return-requests/persistence/entities/return-request-item.entity';
import { ReturnRequestItemStatusEnum } from '@/return-requests/domain/return-request-item-status.enum';
import { CheckoutPaymentOrderEntity } from './persistence/entities/checkout-payment-order.entity';
import { PaymentRefundStatusEnum } from '@/return-requests/domain/payment-refund-status.enum';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { SalesOrdersService } from '@/sales-orders/sales-orders.service';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipsService } from '@/memberships/memberships.service';
import { CreateMembershipCheckoutPaymentDto } from '@/checkout-payments/dto/create-membership-checkout-payment.dto';
import { InitiateMembershipPaymentResponseDto } from '@/checkout-payments/dto/initiate-membership-payment-response.dto';
import { MayaWebhookEventEntity } from './persistence/entities/maya-webhook-event.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { MailService } from '@/mail/mail.service';
import { WalletWithdrawalRepository } from '@/wallets/persistence/repositories/wallet-withdrawal.repository';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';
import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { PaymentGatewayResolver } from './gateways/payment-gateway.resolver';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { SubscriptionPaymentsService } from '@/subscription-payments/subscription-payments.service';
import { CreateSubscriptionCheckoutPaymentDto } from '@/checkout-payments/dto/create-subscription-checkout-payment.dto';
import { InitiateSubscriptionPaymentResponseDto } from '@/checkout-payments/dto/initiate-subscription-payment-response.dto';

const MAX_TRANSACTION_NUMBER_RETRIES = 3;

const CANCELLABLE_GUEST_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.PENDING,
  BookingStatusEnum.AWAITING_CONFIRMATION,
];

const CANCELLABLE_GUEST_ORDER_STATUSES: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
];

/**
 * Checkout Payments Service.
 *
 * Handles business logic for checkout payment processing. Manages payment
 * initiation, gateway integration, payment callbacks, refunds, and transaction
 * number generation.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class CheckoutPaymentsService {
  private readonly logger = new Logger(CheckoutPaymentsService.name);

  constructor(
    private readonly repository: BaseCheckoutPaymentRepository,
    private readonly membershipPaymentRepository: BaseMembershipPaymentRepository,
    private readonly checkoutOrdersService: CheckoutOrdersService,
    private readonly payMongoService: PayMongoService,
    private readonly notificationsService: NotificationsService,
    private readonly dragonPayV2Service: DragonPayV2Service,
    private readonly mayaCheckoutService: MayaCheckoutService,
    private readonly mailService: MailService,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(ReturnRequestEntity)
    private readonly returnRequestRepository: Repository<ReturnRequestEntity>,
    @InjectRepository(ReturnRequestItemEntity)
    private readonly returnRequestItemRepository: Repository<ReturnRequestItemEntity>,
    @InjectRepository(CheckoutPaymentOrderEntity)
    private readonly paymentOrderRepository: Repository<CheckoutPaymentOrderEntity>,
    @InjectRepository(ShoppingCartEntity)
    private readonly shoppingCartRepository: Repository<ShoppingCartEntity>,
    @InjectRepository(ShoppingCartItemEntity)
    private readonly shoppingCartItemRepository: Repository<ShoppingCartItemEntity>,
    @InjectRepository(MayaWebhookEventEntity)
    private readonly mayaWebhookEventRepository: Repository<MayaWebhookEventEntity>,
    @Inject(forwardRef(() => SalesOrdersService))
    private readonly salesOrdersService: SalesOrdersService,
    @Inject(forwardRef(() => MembershipsService))
    private readonly membershipsService: MembershipsService,
    private readonly orderTrackingService: OrderTrackingService,
    private readonly walletWithdrawalRepository: WalletWithdrawalRepository,
    private readonly walletTransactionService: WalletTransactionService,
    private readonly walletRepository: WalletRepository,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    private readonly inventoryStocksService: InventoryStocksService,
    private readonly paymentGatewayResolver: PaymentGatewayResolver,
    private readonly dataSource: DataSource,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPaymentEntity>,
    private readonly subscriptionPaymentsService: SubscriptionPaymentsService,
  ) {}

  /**
   * Advisory-lock namespace for checkout-payment order-creation serialization.
   * Two-arg pg_advisory_xact_lock(classid, objid) isolates this lock's keyspace
   * from any future advisory locks in other features.
   */
  private static readonly ORDER_CREATION_LOCK_CLASSID = 4701;

  /**
   * Initiate payment for a checkout order or sales order.
   *
   * DragonPay V2 is the PRIMARY gateway for all non-COD payments.
   * COD payments are recorded directly without gateway interaction.
   *
   * For sales orders: amount, currency_code, and description are
   * passed via the DTO to avoid circular dependency with
   * SalesOrdersService.
   *
   * @param input - Create payment DTO
   * @param user - Current authenticated user
   * @returns Created payment with checkout URL if applicable
   */
  async initiatePayment(
    input: CreateCheckoutPaymentDto,
    user: User,
  ): Promise<CheckoutPayment> {
    const requestedPaymentMethodCode = String(
      input.payment_method_code || '',
    ).toLowerCase();
    const normalizedPaymentMethodCode =
      requestedPaymentMethodCode === 'paymaya' ||
      requestedPaymentMethodCode === 'paymaya_direct'
        ? 'maya'
        : requestedPaymentMethodCode;

    const hasValidSalesOrderId =
      Number.isInteger(input.sales_order_id) &&
      Number(input.sales_order_id) > 0;
    const hasValidCheckoutOrderId =
      Number.isInteger(input.checkout_order_id) &&
      Number(input.checkout_order_id) > 0;
    const hasValidAmount =
      typeof input.amount === 'number' &&
      Number.isFinite(input.amount) &&
      input.amount > 0;

    if (
      input.sales_order_id !== null &&
      input.sales_order_id !== undefined &&
      !hasValidSalesOrderId
    ) {
      throw new BadRequestException(
        'sales_order_id must be a positive integer',
      );
    }

    if (
      input.checkout_order_id !== null &&
      input.checkout_order_id !== undefined &&
      !hasValidCheckoutOrderId
    ) {
      throw new BadRequestException(
        'checkout_order_id must be a positive integer',
      );
    }

    if (
      input.amount !== null &&
      input.amount !== undefined &&
      !hasValidAmount
    ) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const isSalesOrder = hasValidSalesOrderId && !hasValidCheckoutOrderId;
    const isSessionBased =
      !hasValidSalesOrderId && !hasValidCheckoutOrderId && hasValidAmount;

    // 1. Resolve order context
    let paymentAmount: number;
    let currencyCode: string;
    let orderDescription: string;
    let currencyId: number | null = null;
    let orderIdForParam: number | null = null;

    if (isSalesOrder) {
      // Sales order flow — amount/currency from DTO
      if (!hasValidAmount) {
        throw new BadRequestException(
          'Amount is required for sales order payments',
        );
      }
      paymentAmount = Number(input.amount);
      currencyCode = input.currency_code || 'PHP';
      orderDescription = input.description || `Sales order payment`;
      orderIdForParam = input.sales_order_id!;

      // Check for existing pending payment
      const existingPayments = await this.repository.findBySalesOrderId(
        input.sales_order_id!,
      );
      const pendingPayment = existingPayments.find(
        (p) =>
          p.status === CheckoutPaymentStatusEnum.PENDING ||
          p.status === CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      );
      if (pendingPayment) {
        throw new BadRequestException(
          'A pending payment already exists for this order',
        );
      }
    } else if (isSessionBased) {
      // NEW: Session-based flow (no order yet, payment first)
      // Amount/currency/description provided in DTO, metadata contains cart data
      if (!hasValidAmount) {
        throw new BadRequestException(
          'Amount is required for session-based payments',
        );
      }
      const idempotencyKey =
        typeof input.metadata?.idempotency_key === 'string'
          ? input.metadata.idempotency_key
          : undefined;

      if (idempotencyKey) {
        const existingPendingSessionPayment =
          await this.repository.findPendingSessionPaymentByIdempotencyKey(
            user.id,
            idempotencyKey,
          );
        if (existingPendingSessionPayment) {
          return existingPendingSessionPayment;
        }
      }

      paymentAmount = Number(input.amount);
      currencyCode = input.currency_code || 'PHP';
      orderDescription =
        input.description || 'Payment pending - order will be created';
      orderIdForParam = null;
    } else {
      // Checkout order flow — existing behavior
      if (!input.checkout_order_id) {
        throw new BadRequestException(
          'Either checkout_order_id, sales_order_id, or amount is required',
        );
      }
      const order = await this.checkoutOrdersService.findById(
        input.checkout_order_id,
        user,
      );

      if (order.payment_status === PaymentStatusEnum.PAID) {
        throw new BadRequestException('Order is already paid');
      }

      const existingPayments = await this.repository.findByCheckoutOrderId(
        input.checkout_order_id,
      );
      const pendingPayment = existingPayments.find(
        (p) =>
          p.status === CheckoutPaymentStatusEnum.PENDING ||
          p.status === CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      );
      if (pendingPayment) {
        throw new BadRequestException(
          'A pending payment already exists for this order',
        );
      }

      paymentAmount = input.amount || order.grand_total;
      if (paymentAmount > order.grand_total) {
        throw new BadRequestException(
          'Payment amount cannot exceed order grand total',
        );
      }
      currencyCode = order.currency?.code || 'PHP';
      currencyId = order.currency_id ?? null;
      orderDescription = `Payment for order ${order.order_number}`;
      orderIdForParam = order.id;
    }

    // 2. Generate transaction number
    const transactionNumber = await this.generateUniqueTransactionNumber();

    // 3. Handle COD — no gateway needed
    if (normalizedPaymentMethodCode === 'cod') {
      const payment = new CheckoutPayment();
      payment.checkout_order_id = input.checkout_order_id ?? null;
      payment.sales_order_id = input.sales_order_id ?? null;
      payment.transaction_number = transactionNumber;
      payment.payment_method_code = 'cod';
      payment.payment_gateway = 'cod';
      payment.gateway_transaction_id = transactionNumber;
      payment.payment_type = input.payment_type || 'full';
      payment.installment_id = input.installment_id || null;
      payment.amount = paymentAmount;
      payment.gateway_fee = 0;
      payment.net_amount = paymentAmount;
      payment.currency_id = currencyId;
      payment.status = CheckoutPaymentStatusEnum.AWAITING_PAYMENT;
      payment.initiated_at = new Date();
      payment.created_by = user as any;
      return this.repository.create(payment);
    }

    // 4. Create payment record FIRST with PENDING status.
    //    This ensures the record exists before the gateway call,
    //    so if the callback arrives before we finish, it won't miss.
    // Gateway fee is set to 0 here; update after gateway responds if needed.
    const gatewayFee = 0;
    const netAmount = paymentAmount - gatewayFee;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const payment = new CheckoutPayment();
    payment.checkout_order_id = input.checkout_order_id ?? null;
    payment.sales_order_id = input.sales_order_id ?? null;
    payment.transaction_number = transactionNumber;
    payment.payment_method_code = normalizedPaymentMethodCode;
    payment.payment_gateway = 'pending';
    payment.gateway_transaction_id = transactionNumber;
    payment.payment_type = input.payment_type || 'full';
    payment.installment_id = input.installment_id || null;
    payment.amount = paymentAmount;
    payment.gateway_fee = gatewayFee;
    payment.net_amount = netAmount;
    payment.currency_id = currencyId;
    payment.status = CheckoutPaymentStatusEnum.PENDING;
    payment.initiated_at = new Date();
    payment.expires_at = expiresAt;
    payment.created_by = user as any;
    // Store metadata for session-based payments
    if (input.metadata) {
      (payment as any).metadata = input.metadata;
    }

    const savedPayment = await this.repository.create(payment);

    // 5. Build param payload used by async callbacks
    let paramData: any;
    if (isSessionBased) {
      // Session-based: no order yet, include metadata in param
      paramData = {
        session_based: true,
        user_id: user.id,
        metadata: input.metadata || {},
      };
    } else if (isSalesOrder) {
      paramData = { sales_order_id: orderIdForParam, user_id: user.id };
    } else {
      paramData = { checkout_order_id: orderIdForParam, user_id: user.id };
    }

    try {
      // 6. Resolve gateway and initiate — strategy pattern handles Maya/GCash/DragonPay routing.
      const gateway = await this.paymentGatewayResolver.resolve(
        normalizedPaymentMethodCode,
      );

      const gatewayResult = await gateway.initiate({
        txnid: transactionNumber,
        amount: paymentAmount,
        currency: currencyCode,
        description: orderDescription,
        email: user.email || '',
        customerName:
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          undefined,
        ipAddress: input.ip_address,
        payment_method_code: normalizedPaymentMethodCode,
        metadata: {
          ...paramData,
          payment_method_code: normalizedPaymentMethodCode,
        },
      });

      // Update gateway name now that we know which gateway was selected.
      await this.repository.update(savedPayment.id, {
        payment_gateway: gatewayResult.gateway,
      } as any);

      // 7. Transition status.
      // Manual GCash: stay AWAITING_PAYMENT (admin must confirm proof).
      // All others: transition only if still PENDING (fast postback safety).
      if (gatewayResult.requires_manual_confirmation) {
        const awaitingPayment =
          await this.repository.transitionToAwaitingPaymentIfPending(
            savedPayment.id,
            gatewayResult.reference_number ?? transactionNumber,
            gatewayResult.qr_image_url ?? null,
          );

        // Session-based (court booking): create sales order NOW with AWAITING_PAYMENT
        // so admin can see it and confirm payment. Mirrors COD which also creates the
        // order at initiation rather than waiting for payment confirmation.
        if (!input.sales_order_id && !input.checkout_order_id) {
          try {
            const createdOrderIds = await this.createOrdersFromPaymentMetadata(
              awaitingPayment,
              'awaiting_payment',
            );
            this.logger.log(
              `Manual GCash: created ${createdOrderIds.length} order(s) as AWAITING_PAYMENT for payment ${awaitingPayment.id}`,
            );
          } catch (error) {
            this.logger.error(
              `Manual GCash: failed to pre-create orders for payment ${awaitingPayment.id}`,
              error,
            );
          }
        }

        // Notify user that payment is submitted and awaiting confirmation (non-blocking)
        this.sendPaymentSubmittedNotification(awaitingPayment).catch(
          (error) => {
            this.logger.error(
              'Failed to send payment submitted notification',
              error,
            );
          },
        );

        return awaitingPayment;
      }

      return this.repository.transitionToAwaitingPaymentIfPending(
        savedPayment.id,
        gatewayResult.reference_number ?? transactionNumber,
        gatewayResult.checkout_url ?? null,
      );
    } catch (error) {
      await this.repository.update(savedPayment.id, {
        status: CheckoutPaymentStatusEnum.FAILED,
        failure_reason:
          error instanceof Error ? error.message : 'Gateway request failed',
      });
      throw error;
    }
  }

  async initiatePaymentForMembership(
    input: CreateMembershipCheckoutPaymentDto,
    user: User,
  ): Promise<InitiateMembershipPaymentResponseDto> {
    const payment: MembershipPayment | null =
      await this.membershipPaymentRepository.findById(
        input.membership_payment_id,
      );
    if (!payment) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    if (payment.user_id !== user.id) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    if (payment.payment_status !== MembershipPaymentStatusEnum.PENDING) {
      throw new BadRequestException('Membership payment is not pending.');
    }

    const transactionNumber: string =
      await this.generateUniqueTransactionNumber();

    const paramData = {
      membership_payment_id: payment.id,
      user_id: user.id,
      payment_method_code: input.payment_method_code,
    };

    try {
      // Resolve gateway using the same pattern as initiatePayment
      const gateway = await this.paymentGatewayResolver.resolve(
        input.payment_method_code,
      );

      const gatewayResult = await gateway.initiate({
        txnid: transactionNumber,
        amount: Number(payment.amount),
        currency: payment.currency || 'PHP',
        description: `Membership ${payment.membership_plan_name} (${payment.membership_plan_code}) - ${payment.billing_duration_months} ${payment.billing_duration_months === 1 ? 'month' : 'months'}`,
        email: user.email || '',
        payment_method_code: input.payment_method_code,
        metadata: paramData,
      });

      const isQrManual = gatewayResult.requires_manual_confirmation === true;
      const expiresAt = isQrManual
        ? new Date(Date.now() + 15 * 60 * 1000)
        : null;

      // Update membership payment with gateway details and QR expiry if applicable
      await this.membershipPaymentRepository.update(payment.id, {
        provider: gatewayResult.gateway,
        provider_reference: transactionNumber,
        gateway_reference_number: gatewayResult.reference_number || null,
        payment_method_code: input.payment_method_code || null,
        expires_at: expiresAt,
      });

      const response: InitiateMembershipPaymentResponseDto =
        new InitiateMembershipPaymentResponseDto();
      response.membership_payment_id = payment.id;
      response.transaction_number = transactionNumber;
      response.gateway_reference_number =
        gatewayResult.reference_number || transactionNumber;
      response.checkout_url = gatewayResult.checkout_url || null;
      response.qr_image_url = gatewayResult.qr_image_url ?? null;
      response.requires_manual_confirmation =
        gatewayResult.requires_manual_confirmation ?? false;
      response.payment_status = MembershipPaymentStatusEnum.PENDING;
      return response;
    } catch (error) {
      await this.membershipPaymentRepository.update(payment.id, {
        payment_status: MembershipPaymentStatusEnum.FAILED,
      });
      throw error;
    }
  }

  /**
   * Resolve a DragonPay callback against `subscription_payments`. Returns the
   * standard `{ result: 'OK' }` envelope when the txnid corresponds to a
   * known subscription payment; returns null otherwise so the membership /
   * not-found branches in `handleDragonPayCallback` can run.
   */
  private async tryHandleDragonPaySubscriptionCallback(
    callback: DragonPayV2CallbackDto,
    postbackData: { txnid: string; refno: string; status: string },
  ): Promise<{ result: string } | null> {
    let metaSubscriptionPaymentId: number | null = null;
    try {
      const parsed = JSON.parse(callback.param1 ?? '{}');
      const value = Number(parsed?.subscription_payment_id);
      if (Number.isInteger(value) && value > 0) {
        metaSubscriptionPaymentId = value;
      }
    } catch {
      // param1 wasn't JSON; not a subscription payment.
    }

    let subscriptionPayment = metaSubscriptionPaymentId
      ? await this.subscriptionPaymentRepository.findOne({
          where: { id: metaSubscriptionPaymentId },
          relations: ['subscription'],
        })
      : null;

    if (!subscriptionPayment) {
      subscriptionPayment = await this.subscriptionPaymentRepository.findOne({
        where: { transaction_id: postbackData.txnid },
        relations: ['subscription'],
      });
    }

    if (!subscriptionPayment) {
      return null;
    }

    if (
      subscriptionPayment.transaction_id &&
      subscriptionPayment.transaction_id !== postbackData.txnid
    ) {
      return null;
    }

    if (postbackData.status === 'S') {
      if (
        subscriptionPayment.payment_status === SubscriptionPaymentStatusEnum.PAID
      ) {
        return { result: 'OK' };
      }
      try {
        await this.subscriptionPaymentsService.processPayment(
          subscriptionPayment.id,
          {
            transaction_id: postbackData.refno || postbackData.txnid,
            payment_method:
              subscriptionPayment.payment_method ?? undefined,
          },
          { id: subscriptionPayment.subscription?.user_id } as User,
        );
      } catch (error) {
        this.logger.error(
          `Failed to mark subscription payment ${subscriptionPayment.id} as paid`,
          error,
        );
      }
    } else if (postbackData.status === 'F') {
      try {
        await this.subscriptionPaymentsService.markAsFailed(
          subscriptionPayment.id,
          { id: subscriptionPayment.subscription?.user_id } as User,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to mark subscription payment ${subscriptionPayment.id} as failed: ${(error as Error).message}`,
        );
      }
    } else if (postbackData.status === 'V') {
      // DragonPay "voided" — leave subscription_payment as pending so the
      // owner can re-initiate; existing service has no CANCELLED state.
    }

    return { result: 'OK' };
  }

  /**
   * Initiate a DragonPay-backed payment for a merchant subscription.
   *
   * Pre-existing `subscription_payments` row must be in `pending` state. On
   * success the row's `transaction_id`, `payment_method` and the gateway's
   * checkout URL are returned to the caller. Activation is triggered later
   * by `handleDragonPayCallback` once DragonPay posts back a successful
   * settlement.
   */
  async initiatePaymentForSubscription(
    input: CreateSubscriptionCheckoutPaymentDto,
    user: User,
  ): Promise<InitiateSubscriptionPaymentResponseDto> {
    const payment = await this.subscriptionPaymentRepository.findOne({
      where: { id: input.subscription_payment_id },
      relations: ['subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Subscription payment does not exist.');
    }

    if (payment.subscription?.user_id !== user.id) {
      throw new NotFoundException('Subscription payment does not exist.');
    }

    if (payment.payment_status !== SubscriptionPaymentStatusEnum.PENDING) {
      throw new BadRequestException('Subscription payment is not pending.');
    }

    const transactionNumber = await this.generateUniqueTransactionNumber();

    const paramData = {
      subscription_payment_id: payment.id,
      subscription_id: payment.subscription_id,
      user_id: user.id,
      payment_method_code: input.payment_method_code,
    };

    try {
      const gateway = await this.paymentGatewayResolver.resolve(
        input.payment_method_code,
      );

      const gatewayResult = await gateway.initiate({
        txnid: transactionNumber,
        amount: Number(payment.amount),
        currency: 'PHP',
        description: `Merchant subscription payment ${payment.payment_number}`,
        email: user.email || '',
        payment_method_code: input.payment_method_code,
        metadata: paramData,
      });

      await this.subscriptionPaymentRepository.update(payment.id, {
        transaction_id: transactionNumber,
        payment_method: input.payment_method_code,
      });

      const response = new InitiateSubscriptionPaymentResponseDto();
      response.subscription_payment_id = payment.id;
      response.transaction_number = transactionNumber;
      response.gateway_reference_number =
        gatewayResult.reference_number || transactionNumber;
      response.checkout_url = gatewayResult.checkout_url || null;
      response.qr_image_url = gatewayResult.qr_image_url ?? null;
      response.requires_manual_confirmation =
        gatewayResult.requires_manual_confirmation ?? false;
      response.payment_status = SubscriptionPaymentStatusEnum.PENDING;
      return response;
    } catch (error) {
      this.logger.error(
        `Subscription payment initiation failed for id=${payment.id}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate a unique transaction number with retry logic.
   */
  private async generateUniqueTransactionNumber(): Promise<string> {
    for (let i = 0; i < MAX_TRANSACTION_NUMBER_RETRIES; i++) {
      const txn = this.generateTransactionNumber();
      // Let DB/network errors propagate — only retry on collision (existing !== null)
      const existing = await this.repository.findByTransactionNumber(txn);
      if (!existing) return txn;
      this.logger.warn(
        `Transaction number collision on attempt ${i + 1}: ${txn}`,
      );
    }
    throw new BadRequestException(
      'Failed to generate unique transaction number after retries',
    );
  }

  /**
   * Handle payment callback/webhook from PayMongo.
   *
   * Updates payment status based on gateway response.
   *
   * @param input - Process payment DTO
   * @returns Updated payment
   */
  async handlePaymentCallback(
    input: ProcessPaymentDto,
  ): Promise<CheckoutPayment> {
    // 1. Find payment by gateway transaction ID
    const payment = await this.repository.findByGatewayTransactionId(
      input.gateway_transaction_id,
    );

    if (!payment) {
      throw new NotFoundException(
        `Payment with gateway transaction ID ${input.gateway_transaction_id} not found`,
      );
    }

    // 2. Verify payment with PayMongo
    const verification = await this.payMongoService.verifyPayment(
      input.gateway_transaction_id,
    );

    // 3. Update payment status
    const updateData: Partial<CheckoutPayment> = {
      gateway_reference_number: input.gateway_reference_number || null,
      gateway_response: input.gateway_response || null,
      updated_at: new Date(),
    };

    if (verification.status === 'paid') {
      updateData.status = CheckoutPaymentStatusEnum.COMPLETED;
      updateData.paid_at = new Date(verification.paid_at || new Date());
    } else if (verification.status === 'failed') {
      updateData.status = CheckoutPaymentStatusEnum.FAILED;
      updateData.failure_reason = 'Payment failed';
    }

    const updated = await this.repository.update(payment.id, updateData);

    await this.cancelGuestBookingsForTerminalPayment({
      payment,
      paymentStatus: updated.status,
      reason: updated.failure_reason,
    });

    // 4. Update sales order payment status (mirrors Maya webhook path)
    if (
      updated.status === CheckoutPaymentStatusEnum.COMPLETED ||
      updated.status === CheckoutPaymentStatusEnum.FAILED
    ) {
      const linkedOrders = await this.paymentOrderRepository.find({
        where: { checkout_payment_id: payment.id },
      });
      if (linkedOrders.length > 0) {
        for (const link of linkedOrders) {
          await this.updateSalesOrderPaymentStatus(
            link.sales_order_id,
            updated.status,
          );
        }
      } else if (updated.sales_order_id) {
        await this.updateSalesOrderPaymentStatus(
          updated.sales_order_id,
          updated.status,
        );
      }
    }

    if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
      // Send payment success notification (non-blocking)
      this.sendPaymentSuccessNotification(updated).catch((error) => {
        this.logger.error('Failed to send payment success notification', error);
      });
    } else if (updated.status === CheckoutPaymentStatusEnum.FAILED) {
      // Send payment failed notification (non-blocking)
      this.sendPaymentFailedNotification(updated).catch((error) => {
        this.logger.error('Failed to send payment failed notification', error);
      });
    }

    // 5. Send payment status notifications to customer
    try {
      // Payment already has checkout_order relation loaded from findByGatewayTransactionId
      if (payment.checkout_order) {
        const checkoutOrder = payment.checkout_order;

        if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
          // Send PAYMENT_SUCCESSFUL notification
          await this.notificationsService.notify(
            checkoutOrder.user_id,
            NotificationTypeEnum.PAYMENT_SUCCESSFUL,
            'Payment Successful!',
            `Your payment of ₱${payment.amount.toFixed(2)} for order #${checkoutOrder.order_number} has been processed successfully.`,
            'payment',
            payment.id,
            `/checkout-orders/${checkoutOrder.id}`,
          );
        } else if (updated.status === CheckoutPaymentStatusEnum.FAILED) {
          // Send PAYMENT_FAILED notification
          await this.notificationsService.notify(
            checkoutOrder.user_id,
            NotificationTypeEnum.PAYMENT_FAILED,
            'Payment Failed',
            `Your payment for order #${checkoutOrder.order_number} has failed. Please try again or use a different payment method.`,
            'payment',
            payment.id,
            `/checkout-orders/${checkoutOrder.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send payment status notification', error);
    }

    return updated;
  }

  /**
   * Handle DragonPay V2 postback callback.
   *
   * Called from DragonPayCallbackController when DragonPay sends a GET postback.
   * Verifies RSA-SHA256 signature, maps DragonPay status to internal status,
   * and sends notifications.
   *
   * Status mapping:
   * - S → COMPLETED (set paid_at)
   * - F → FAILED (set failure_reason)
   * - P/U → keep AWAITING_PAYMENT (async postback will come later)
   * - V → CANCELLED
   *
   * @returns { result: 'OK' } on success
   */
  async handleDragonPayCallback(
    callback: DragonPayV2CallbackDto,
  ): Promise<{ result: string }> {
    // 1. Verify RSA-SHA256 signature
    const postbackData =
      await this.dragonPayV2Service.processPostback(callback);

    // 2. Find payment by transaction number (txnid = our transaction_number)
    const payment = await this.repository.findByTransactionNumber(
      postbackData.txnid,
    );

    if (!payment) {
      const subscriptionResult =
        await this.tryHandleDragonPaySubscriptionCallback(
          callback,
          postbackData,
        );
      if (subscriptionResult) {
        return subscriptionResult;
      }

      const membershipPaymentId: number = Number(callback.param1);
      const hasValidMembershipPaymentId: boolean =
        Number.isInteger(membershipPaymentId) && membershipPaymentId > 0;
      if (!hasValidMembershipPaymentId) {
        throw new NotFoundException(
          `Payment with txnid ${postbackData.txnid} not found`,
        );
      }
      const membershipPayment: MembershipPayment | null =
        await this.membershipPaymentRepository.findById(membershipPaymentId);
      if (!membershipPayment) {
        throw new NotFoundException(
          `Payment with txnid ${postbackData.txnid} not found`,
        );
      }
      if (membershipPayment.provider_reference !== postbackData.txnid) {
        throw new NotFoundException(
          `Payment with txnid ${postbackData.txnid} not found`,
        );
      }
      const updateData: Partial<MembershipPayment> = {
        provider: 'dragonpay',
        gateway_reference_number: postbackData.refno,
      };
      switch (postbackData.status) {
        case 'S':
          updateData.payment_status = MembershipPaymentStatusEnum.PAID;
          updateData.paid_at = new Date();
          break;
        case 'F':
          updateData.payment_status = MembershipPaymentStatusEnum.FAILED;
          break;
        case 'V':
          updateData.payment_status = MembershipPaymentStatusEnum.CANCELLED;
          break;
      }
      if (updateData.payment_status) {
        await this.membershipPaymentRepository.update(
          membershipPayment.id,
          updateData,
        );
      }
      if (postbackData.status === 'S') {
        try {
          await this.membershipsService.activateMembership(
            { membership_payment_id: membershipPayment.id },
            { id: membershipPayment.user_id } as User,
          );
        } catch (error) {
          this.logger.error(
            `Failed to auto-activate membership for payment ${membershipPayment.id}`,
            error,
          );
        }
      }
      return { result: 'OK' };
    }

    this.logger.debug(
      `Payment found: id=${payment.id}, sales_order_id=${payment.sales_order_id}, status=${payment.status}, dragonpay_status=${postbackData.status}`,
    );

    // 3. Idempotency check — skip reprocessing if we already recorded this
    //    exact refno+status combination to prevent duplicate order creation
    //    and double-notifications on repeated postbacks.
    //
    //    For successful postbacks, verify orders exist in checkout_payment_orders.
    //    If the table is empty, order creation failed on the first attempt —
    //    fall through so it can be retried via DragonPay re-postback.
    if (
      payment.gateway_reference_number === postbackData.refno &&
      ((postbackData.status === 'S' &&
        payment.status === CheckoutPaymentStatusEnum.COMPLETED) ||
        (postbackData.status === 'F' &&
          payment.status === CheckoutPaymentStatusEnum.FAILED) ||
        (postbackData.status === 'V' &&
          payment.status === CheckoutPaymentStatusEnum.CANCELLED))
    ) {
      // For a successful postback, verify orders were actually created.
      // Check both checkout_payment_orders (new flow) and sales_order_id (legacy).
      // If neither has orders, order creation failed on the first attempt —
      // fall through so it can be retried via DragonPay re-postback.
      if (postbackData.status === 'S') {
        const existingLinks = await this.paymentOrderRepository.find({
          where: { checkout_payment_id: payment.id },
        });
        const hasOrders =
          existingLinks.length > 0 || payment.sales_order_id != null;
        if (!hasOrders) {
          this.logger.warn(
            `Completed payment ${payment.id} has no linked orders — retrying order creation`,
          );
          // Fall through to order creation below
        } else {
          this.logger.warn(
            `Postback rejected — payment ${payment.id} already completed with orders for txnid=${postbackData.txnid}`,
          );
          throw new BadRequestException('Payment already processed');
        }
      } else {
        // F or V: already recorded this terminal status — reject re-postback
        this.logger.warn(
          `Postback rejected — payment ${payment.id} already completed with orders for txnid=${postbackData.txnid}`,
        );
        throw new BadRequestException('Payment already processed');
      }
    }

    const isAlreadyCompleted =
      payment.status === CheckoutPaymentStatusEnum.COMPLETED;

    if (isAlreadyCompleted) {
      this.logger.log(
        `Payment ${postbackData.txnid} already completed, reconciling linked orders`,
      );
    }

    let updated = payment;
    if (!isAlreadyCompleted) {
      // 4. Map DragonPay status to internal status
      const updateData: Partial<CheckoutPayment> = {
        gateway_reference_number: postbackData.refno,
        gateway_response: callback as any,
        updated_at: new Date(),
      };

      switch (postbackData.status) {
        case 'S': // Success
          updateData.status = CheckoutPaymentStatusEnum.COMPLETED;
          updateData.paid_at = new Date();
          break;
        case 'F': // Failure
          updateData.status = CheckoutPaymentStatusEnum.FAILED;
          updateData.failure_reason = postbackData.message;
          break;
        case 'V': // Void/Cancelled
          updateData.status = CheckoutPaymentStatusEnum.CANCELLED;
          break;
        case 'P': // Pending
        case 'U': // Unknown (still processing)
          // Keep as AWAITING_PAYMENT — async postback will come later
          break;
      }

      updated = await this.repository.update(payment.id, updateData);
    }

    // Guest venue booking: on successful payment, confirm booking and email guest.
    // We treat this as best-effort and do not fail the callback if it errors.
    if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
      const paymentMetadata = (payment as any).metadata;
      const isGuestBooking = !!paymentMetadata?.guest_booking;
      const alreadyEmailed = !!paymentMetadata?.guest_booking_email_sent;
      if (isGuestBooking && !alreadyEmailed) {
        this.sendGuestBookingConfirmationFromPayment(payment, updated)
          .then(() => {
            // Mark as sent only after successful SMTP send.
            const nextMetadata = {
              ...(paymentMetadata || {}),
              guest_booking_email_sent: true,
              guest_booking_email_sent_at: new Date().toISOString(),
            };
            return this.repository.update(payment.id, {
              metadata: nextMetadata,
            } as any);
          })
          .catch((err) => {
            this.logger.error(
              `Failed to send guest booking confirmation for payment ${payment.id}`,
              err,
            );
          });
      }
    }

    let createdOrderIds: number[] = [];

    // 4a. Create orders from metadata if this is a session-based payment
    // (payment succeeded but no order was created yet)
    if (
      updated.status === CheckoutPaymentStatusEnum.COMPLETED &&
      !payment.sales_order_id
    ) {
      try {
        createdOrderIds = await this.createOrdersFromPaymentMetadata(payment);
        this.logger.log(
          `Created ${createdOrderIds.length} order(s) from payment ${payment.id} metadata`,
        );
        if (createdOrderIds.length > 0) {
          await this.sendPaymentSuccessNotificationsForOrderIds(
            createdOrderIds,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to create orders from payment ${payment.id} metadata`,
          error,
        );
        // Payment already succeeded — notify the user that order creation failed
        // so they can contact support rather than waiting indefinitely.
        const failureMetadata = (payment as any).metadata;
        const failureUserId: number | null = failureMetadata?.user_id ?? null;
        if (failureUserId) {
          this.notificationsService
            .sendPaymentFailed(
              failureUserId,
              payment.id,
              payment.transaction_number ?? String(payment.id),
              error instanceof Error
                ? error.message
                : 'Order creation failed after payment. Please contact support.',
              true,
              undefined,
              undefined,
            )
            .catch((notifyErr) => {
              this.logger.error(
                `Failed to notify user ${failureUserId} of order-creation failure`,
                notifyErr,
              );
            });
        }
      }
    }

    // 5. Update ALL linked sales orders via join table
    const linkedOrders = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: payment.id },
    });

    if (linkedOrders.length > 0) {
      this.logger.debug(
        `Updating ${linkedOrders.length} linked sales order(s) for payment ${payment.id}, status=${updated.status}`,
      );
      for (const link of linkedOrders) {
        await this.updateSalesOrderPaymentStatus(
          link.sales_order_id,
          updated.status,
        );

        // Create tracking event for payment outcome
        if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
          this.orderTrackingService
            .createEvent(
              link.sales_order_id,
              OrderEventTypeEnum.PAYMENT_CONFIRMED,
              'Payment confirmed successfully',
            )
            .catch((err) =>
              this.logger.error(
                `Failed to create PAYMENT_CONFIRMED event for order ${link.sales_order_id}`,
                err,
              ),
            );
        } else if (
          updated.status === CheckoutPaymentStatusEnum.FAILED ||
          updated.status === CheckoutPaymentStatusEnum.CANCELLED
        ) {
          this.orderTrackingService
            .createEvent(
              link.sales_order_id,
              OrderEventTypeEnum.PAYMENT_EXPIRED,
              `Payment failed: ${postbackData.message ?? 'Transaction could not be completed'}`,
            )
            .catch((err) =>
              this.logger.error(
                `Failed to create PAYMENT_EXPIRED event for order ${link.sales_order_id}`,
                err,
              ),
            );
        }
      }
    } else {
      this.logger.debug(
        `No linked orders in join table for payment ${payment.id}, skipping sales order update`,
      );
    }

    await this.cancelGuestBookingsForTerminalPayment({
      payment,
      paymentStatus: updated.status,
      reason: postbackData.message,
    });

    // 6. Clear cart for successful non-COD payments.
    // For order-first payments: get user_id from linked order.
    // For session-based payments: get user_id from payment metadata
    // (orders were just created above, so linkedOrders is now populated).
    if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
      const canClearCart =
        !!payment.sales_order_id ||
        linkedOrders.length > 0 ||
        createdOrderIds.length > 0;

      if (!canClearCart) {
        this.logger.warn(
          `Skipping cart clear for payment ${payment.id}: no linked orders were created/found`,
        );
        return { result: 'OK' };
      }

      let userIdToClear: number | null = null;

      if (linkedOrders.length > 0) {
        const firstOrder = await this.salesOrderRepository.findOne({
          where: { id: linkedOrders[0].sales_order_id },
          select: ['id', 'user_id'],
        });
        userIdToClear = firstOrder?.user_id ?? null;
      } else {
        // Session-based: orders were just created, re-query the join table
        const freshLinks = await this.paymentOrderRepository.find({
          where: { checkout_payment_id: payment.id },
        });
        if (freshLinks.length > 0) {
          const firstOrder = await this.salesOrderRepository.findOne({
            where: { id: freshLinks[0].sales_order_id },
            select: ['id', 'user_id'],
          });
          userIdToClear = firstOrder?.user_id ?? null;
        } else {
          // Fallback: extract user_id from payment metadata
          const metadata = (payment as any).metadata;
          userIdToClear = metadata?.user_id ?? null;
        }
      }

      if (userIdToClear) {
        // Extract the snapshot item IDs so we only remove items that were
        // checked out, not items the user may have added after payment initiation.
        const paymentMetadata = (payment as any).metadata;
        const snapshotItemIds: number[] | null = Array.isArray(
          paymentMetadata?.cart_items,
        )
          ? paymentMetadata.cart_items
              .map((item: any) => item.id)
              .filter((id: any) => typeof id === 'number' && id > 0)
          : null;

        this.logger.log(
          `Clearing cart for user ${userIdToClear} after successful payment (${snapshotItemIds?.length ?? 'all'} item(s))`,
        );
        await this.clearUserCart(userIdToClear, snapshotItemIds);
      }
    }

    // 7. Send notifications (non-blocking)
    if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
      this.sendPaymentSuccessNotification(updated).catch((error) => {
        this.logger.error('Failed to send payment success notification', error);
      });
    } else if (updated.status === CheckoutPaymentStatusEnum.FAILED) {
      this.sendPaymentFailedNotification(updated).catch((error) => {
        this.logger.error('Failed to send payment failed notification', error);
      });
    }

    return { result: 'OK' };
  }

  private async sendGuestBookingConfirmationFromPayment(
    payment: CheckoutPayment,
    updatedPayment: CheckoutPayment,
  ): Promise<void> {
    const metadata = (payment as any).metadata;

    const bookingId: number | null =
      typeof metadata?.booking_id === 'number' ? metadata.booking_id : null;
    const bookingIdsFromMetadata: number[] = Array.isArray(
      metadata?.booking_ids,
    )
      ? metadata.booking_ids
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    let salesOrderId: number | null = payment.sales_order_id ?? null;
    if (!salesOrderId) {
      const linkedPaymentOrder = await this.paymentOrderRepository.findOne({
        where: { checkout_payment_id: payment.id },
        order: { is_primary: 'DESC', created_at: 'ASC' },
      });
      salesOrderId = linkedPaymentOrder?.sales_order_id ?? null;
    }

    let bookings: BookingEntity[] = [];

    if (bookingIdsFromMetadata.length > 0) {
      bookings = await this.bookingRepository.find({
        where: { id: In(bookingIdsFromMetadata) } as any,
        relations: ['service', 'seller', 'customer', 'booking_guests'],
      });
    } else {
      const booking = await this.bookingRepository.findOne({
        where: bookingId
          ? ({ id: bookingId } as any)
          : ({ sales_order_id: salesOrderId } as any),
        relations: ['service', 'seller', 'customer', 'booking_guests'],
      });
      if (booking) {
        bookings = [booking];
      }
    }

    if (!bookings.length) {
      return;
    }

    const bookingsById = new Map(bookings.map((b) => [b.id, b]));
    const orderedBookings =
      bookingIdsFromMetadata.length > 0
        ? bookingIdsFromMetadata
            .map((id) => bookingsById.get(id))
            .filter((b): b is BookingEntity => Boolean(b))
        : bookings;
    const primaryBooking = orderedBookings[0];
    const roster = [...(primaryBooking.booking_guests ?? [])].sort(
      (left, right) =>
        left.sort_order !== right.sort_order
          ? left.sort_order - right.sort_order
          : left.id - right.id,
    );
    const primaryGuest =
      roster.find((guest) => guest.is_primary_contact) ?? roster[0] ?? null;

    // Auto-confirm venue bookings on payment success
    for (const booking of orderedBookings) {
      if (
        booking.service?.service_type === ServiceTypeEnum.VENUE &&
        booking.status === BookingStatusEnum.PENDING
      ) {
        await this.bookingRepository.update(booking.id, {
          status: BookingStatusEnum.CONFIRMED,
          confirmed_at: new Date(),
          updated_at: new Date(),
        } as any);
      }
    }

    const recipientEmail: string | null =
      (metadata?.guest_email as string | undefined) ??
      primaryGuest?.email ??
      primaryBooking.guest_email ??
      primaryBooking.customer?.email ??
      null;

    if (!recipientEmail) {
      return;
    }

    const firstName =
      primaryGuest?.first_name ?? primaryBooking.customer?.first_name ?? '';
    const lastName =
      primaryGuest?.last_name ?? primaryBooking.customer?.last_name ?? '';
    const guestName =
      [firstName, lastName].filter(Boolean).join(' ').trim() || 'Guest';
    const additionalGuestNames = roster
      .filter((guest) => !guest.is_primary_contact)
      .map((guest) =>
        `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim(),
      )
      .filter(Boolean);
    const guestCount =
      typeof metadata?.guest_count === 'number'
        ? Number(metadata.guest_count)
        : Number(
            primaryBooking.guest_count ??
              (roster.length > 0 ? roster.length : 1),
          );
    const guestNamesSummary =
      typeof metadata?.guest_names_summary === 'string' &&
      metadata.guest_names_summary.trim()
        ? metadata.guest_names_summary.trim()
        : roster.length > 0
          ? roster
              .map((guest) =>
                `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim(),
              )
              .filter(Boolean)
              .join(', ')
          : guestName;

    const serviceTitle = primaryBooking.service?.title ?? 'Venue';
    const sellerName = primaryBooking.seller?.store_name ?? 'Provider';
    const bookingGroupNumberFromMetadata =
      typeof metadata?.booking_group_number === 'string' &&
      metadata.booking_group_number.trim().length > 0
        ? metadata.booking_group_number.trim()
        : '';
    const bookingNumbersFromMetadata: string[] = Array.isArray(
      metadata?.booking_numbers,
    )
      ? metadata.booking_numbers.filter(
          (value: any): value is string => typeof value === 'string',
        )
      : [];
    const bookingNumbers =
      bookingNumbersFromMetadata.length > 0
        ? bookingNumbersFromMetadata
        : orderedBookings.map((booking) => booking.booking_number);
    const publicBookingNumber =
      bookingGroupNumberFromMetadata ||
      String(primaryBooking.booking_group_number || '').trim() ||
      primaryBooking.booking_number;

    const uniqueDates = [
      ...new Set(
        orderedBookings
          .map((booking) =>
            booking.scheduled_date
              ? new Date(booking.scheduled_date).toISOString().split('T')[0]
              : '',
          )
          .filter(Boolean),
      ),
    ];
    const scheduleDate =
      uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.join(', ');

    const sortedByStart = [...orderedBookings].sort((a, b) =>
      (a.scheduled_start_time || '').localeCompare(
        b.scheduled_start_time || '',
      ),
    );
    const firstBookingSlot = sortedByStart[0];
    const lastBookingSlot = sortedByStart[sortedByStart.length - 1];
    const scheduledStartTime = firstBookingSlot?.scheduled_start_time || '';
    const scheduledEndTime =
      lastBookingSlot?.scheduled_end_time ||
      lastBookingSlot?.scheduled_start_time ||
      '';
    const slotDetails = orderedBookings.map((booking) => {
      const scheduledStartTime = String(
        booking.scheduled_start_time || '',
      ).trim();
      const scheduledEndTime = String(
        booking.scheduled_end_time || booking.scheduled_start_time || '',
      ).trim();
      const slotDurationMinutes = this.resolveEmailSlotDurationMinutes(
        booking.service?.slot_duration_minutes,
      );

      return {
        bookingNumber: String(booking.booking_number || '').trim(),
        serviceTitle: String(booking.service?.title || '').trim() || 'Venue',
        scheduledDate: booking.scheduled_date
          ? new Date(booking.scheduled_date).toISOString().split('T')[0]
          : '',
        scheduledStartTime,
        scheduledEndTime,
        slotCount: this.computeEmailSlotCount({
          scheduledStartTime,
          scheduledEndTime,
          slotDurationMinutes,
        }),
        status: String(booking.status || '').trim(),
      };
    });
    const normalizedRecipientEmail = String(recipientEmail || '')
      .trim()
      .toLowerCase();
    const bookingActionUrl = `/pickleball-selection/payment/${encodeURIComponent(
      publicBookingNumber,
    )}?email=${encodeURIComponent(normalizedRecipientEmail)}`;

    await this.mailService.sendGuestBookingConfirmationEmail({
      to: recipientEmail,
      data: {
        guestName,
        bookingNumber: publicBookingNumber,
        bookingNumbers,
        primaryGuestName: guestName,
        primaryGuestEmail: recipientEmail,
        primaryGuestPhone:
          typeof primaryGuest?.phone === 'string' && primaryGuest.phone.trim()
            ? primaryGuest.phone.trim()
            : null,
        additionalGuestNames,
        guestCount,
        guestNamesSummary,
        serviceTitle,
        sellerName,
        scheduledDate: scheduleDate,
        scheduledStartTime,
        scheduledEndTime,
        slotDetails,
        bookingStatusLabel: 'Confirmed',
        paymentStatusLabel: 'Paid',
        actionUrl: bookingActionUrl,
        ctaLabel: 'View Booking Details',
        amount: Number(updatedPayment.amount),
        currency: 'PHP',
      },
    });
  }

  /**
   * Handle DragonPay payout callback.
   *
   * Processes payout status updates from DragonPay. Payout callbacks indicate
   * refund status changes (success, failed, queued).
   *
   * Status mapping:
   * - S → Refund completed (update return request status)
   * - F → Refund failed (update return request status and notify)
   * - Q → Refund queued (awaiting processing)
   *
   * @param callback - Payout callback data from DragonPay
   * @returns { result: 'OK' } on success
   */
  async handleDragonPayPayoutCallback(
    callback: DragonPayV2PayoutCallbackDto,
  ): Promise<{ result: string }> {
    // 1. Verify RSA-SHA256 signature
    const postbackData =
      await this.dragonPayV2Service.processPayoutPostback(callback);

    // 2. Find return request by payment_refund_reference (stores payout txnId)
    const returnRequest = await this.returnRequestRepository.findOne({
      where: { payment_refund_reference: postbackData.merchantTxnId },
      relations: ['user'],
    });

    if (!returnRequest) {
      // Check if this txnId matches a wallet withdrawal payout instead
      const withdrawal =
        await this.walletWithdrawalRepository.findByPayoutReference(
          postbackData.merchantTxnId,
        );

      if (withdrawal) {
        this.logger.log(
          `Payout callback matched wallet withdrawal id=${withdrawal.id}, status=${postbackData.status}`,
        );

        if (postbackData.status === 'S') {
          await this.walletWithdrawalRepository.updateStatus(
            withdrawal.id,
            WithdrawalStatusEnum.COMPLETED,
            {
              payout_status: 'completed',
              completed_at: new Date(),
            },
          );
          this.logger.log(
            `Wallet withdrawal ${withdrawal.id} marked COMPLETED via DragonPay payout callback`,
          );
          const wallet = await this.walletRepository.findById(
            withdrawal.wallet_id,
          );
          if (wallet) {
            this.notificationsService
              .sendWithdrawalCompleted(
                wallet.user_id,
                withdrawal.id,
                withdrawal.amount,
              )
              .catch(() => {});
          }
        } else if (postbackData.status === 'F' || postbackData.status === 'V') {
          await this.walletWithdrawalRepository.updateStatus(
            withdrawal.id,
            WithdrawalStatusEnum.FAILED,
            {
              payout_status: 'failed',
              failure_reason: `DragonPay payout status: ${postbackData.status}`,
            },
          );
          this.logger.warn(
            `Wallet withdrawal ${withdrawal.id} marked FAILED via DragonPay payout callback (status=${postbackData.status})`,
          );
        } else {
          // Non-terminal status (P=Pending, Q=Queued, H=OnHold, G=InProgress) — no update needed
          this.logger.log(
            `Wallet withdrawal ${withdrawal.id} payout in-progress (${postbackData.status}) — no status change`,
          );
        }

        return { result: 'OK' };
      }

      this.logger.warn(
        `No return request or wallet withdrawal found for payout merchantTxnId ${postbackData.merchantTxnId}`,
      );
      throw new NotFoundException(
        `No record found for payout merchantTxnId ${postbackData.merchantTxnId}`,
      );
    }

    this.logger.debug(
      `Payout callback for return request id=${returnRequest.id}, order_id=${returnRequest.order_id}, payout_status=${postbackData.status}`,
    );

    // 3. Idempotency: skip if we already recorded this exact terminal state
    const terminalMap: Partial<Record<string, PaymentRefundStatusEnum>> = {
      S: PaymentRefundStatusEnum.COMPLETED,
      F: PaymentRefundStatusEnum.FAILED,
      V: PaymentRefundStatusEnum.FAILED,
    };
    if (
      terminalMap[postbackData.status] &&
      returnRequest.payment_refund_status === terminalMap[postbackData.status]
    ) {
      this.logger.log(
        `Idempotent payout postback for return request ${returnRequest.id} (status=${postbackData.status}) already processed — returning OK`,
      );
      return { result: 'OK' };
    }

    // 4. Update return request payment_refund_status based on payout status
    if (postbackData.status === 'S') {
      // Money confirmed sent — set REFUNDED and mark items as refunded
      await this.returnRequestRepository.update(returnRequest.id, {
        payment_refund_status: PaymentRefundStatusEnum.COMPLETED,
        payment_refund_at: new Date(),
        status: ReturnRequestStatusEnum.REFUNDED,
        refunded_at: new Date(),
        refunded_by: returnRequest.payment_refund_by ?? undefined,
      });
      await this.returnRequestItemRepository.update(
        { return_request_id: returnRequest.id },
        { item_status: ReturnRequestItemStatusEnum.REFUNDED },
      );
      // Set sales order status to REFUNDED now that money is sent
      if (returnRequest.order_id) {
        await this.salesOrderRepository.update(returnRequest.order_id, {
          status: OrderStatusEnum.REFUNDED,
        });
      }

      // Deduct refund amount from seller wallet now that payout is confirmed
      if (returnRequest.seller_id && returnRequest.payment_refund_amount) {
        await this.walletTransactionService
          .deductReturn({
            sellerId: returnRequest.seller_id,
            returnRequestId: returnRequest.id,
            amount: Number(returnRequest.payment_refund_amount),
          })
          .catch((err) =>
            this.logger.error(
              `Failed to deduct return ${returnRequest.id} from seller wallet`,
              err,
            ),
          );
      }

      this.logger.log(
        `Payout completed for return request ${returnRequest.id}`,
      );

      if (returnRequest.order_id) {
        this.orderTrackingService
          .createEvent(
            returnRequest.order_id,
            OrderEventTypeEnum.REFUND_PROCESSED,
            `Refund of ₱${postbackData.amount.toFixed(2)} successfully sent to customer`,
          )
          .catch((err) =>
            this.logger.error(
              `Failed to create REFUND_PROCESSED event for order ${returnRequest.order_id}`,
              err,
            ),
          );
      }

      // Send success notification to customer (non-blocking)
      if (returnRequest.user) {
        this.notificationsService
          .notify(
            returnRequest.user_id,
            NotificationTypeEnum.PAYMENT_SUCCESSFUL,
            'Refund Processed',
            `Your refund of ₱${postbackData.amount.toFixed(2)} has been successfully sent to your account.`,
            'return_request',
            returnRequest.id,
          )
          .catch((error) => {
            this.logger.error(
              'Failed to send payout success notification',
              error,
            );
          });
      }
    } else if (postbackData.status === 'F' || postbackData.status === 'V') {
      // F=Failed, V=Voided — mark as refund_failed so it's clear the payout did not go through
      await this.returnRequestRepository.update(returnRequest.id, {
        payment_refund_status: PaymentRefundStatusEnum.FAILED,
        status: ReturnRequestStatusEnum.REFUND_FAILED,
      });
      const payoutFailedReason =
        postbackData.status === 'V' ? 'Payout voided' : 'Payout failed';
      this.logger.warn(
        `Payout ${postbackData.status === 'V' ? 'voided' : 'failed'} for return request ${returnRequest.id}: ${postbackData.message}`,
      );

      if (returnRequest.order_id) {
        this.orderTrackingService
          .createEvent(
            returnRequest.order_id,
            OrderEventTypeEnum.EXCEPTION,
            `${payoutFailedReason}: ${postbackData.message ?? 'Refund could not be processed. Seller may retry.'}`,
          )
          .catch((err) =>
            this.logger.error(
              `Failed to create EXCEPTION event for order ${returnRequest.order_id}`,
              err,
            ),
          );
      }

      // Send failure notification to customer (non-blocking)
      if (returnRequest.user) {
        this.notificationsService
          .notify(
            returnRequest.user_id,
            NotificationTypeEnum.PAYMENT_FAILED,
            'Refund Failed',
            `Your refund could not be processed. Please contact support. Reason: ${postbackData.message}`,
            'return_request',
            returnRequest.id,
          )
          .catch((error) => {
            this.logger.error(
              'Failed to send payout failed notification',
              error,
            );
          });
      }
    } else if (['P', 'H', 'G'].includes(postbackData.status)) {
      // P=Pending, H=OnHold, G=InProgress — non-terminal, keep as PROCESSING
      this.logger.log(
        `Payout in-progress (${postbackData.status}) for return request ${returnRequest.id}`,
      );
    }

    return { result: 'OK' };
  }

  /**
   * Update sales order payment_status based on payment status.
   * Also auto-confirms the order when payment succeeds (non-COD flow).
   */
  private isGuestBookingPayment(payment: CheckoutPayment): boolean {
    const metadata = (payment as any)?.metadata as Record<string, unknown>;
    const guestBookingFlag = metadata?.guest_booking;
    return (
      guestBookingFlag === true ||
      String(guestBookingFlag || '')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  private async resolveLinkedSalesOrderIdsForPayment(
    payment: CheckoutPayment,
  ): Promise<number[]> {
    const salesOrderIds = new Set<number>();

    if (
      typeof payment.sales_order_id === 'number' &&
      Number.isInteger(payment.sales_order_id) &&
      payment.sales_order_id > 0
    ) {
      salesOrderIds.add(payment.sales_order_id);
    }

    const links = await this.paymentOrderRepository.find({
      where: {
        checkout_payment_id: payment.id,
      },
      select: ['sales_order_id'],
    });
    for (const link of links) {
      if (
        typeof link.sales_order_id === 'number' &&
        Number.isInteger(link.sales_order_id) &&
        link.sales_order_id > 0
      ) {
        salesOrderIds.add(link.sales_order_id);
      }
    }

    return [...salesOrderIds];
  }

  private async cancelGuestBookingsForTerminalPayment(params: {
    payment: CheckoutPayment;
    paymentStatus: CheckoutPaymentStatusEnum;
    reason?: string | null;
  }): Promise<void> {
    const { payment, paymentStatus, reason } = params;

    if (
      paymentStatus !== CheckoutPaymentStatusEnum.FAILED &&
      paymentStatus !== CheckoutPaymentStatusEnum.CANCELLED &&
      paymentStatus !== CheckoutPaymentStatusEnum.EXPIRED
    ) {
      return;
    }

    if (!this.isGuestBookingPayment(payment)) {
      return;
    }

    const salesOrderIds =
      await this.resolveLinkedSalesOrderIdsForPayment(payment);
    if (salesOrderIds.length === 0) {
      return;
    }

    const now = new Date();
    const cancellationReason =
      String(reason || '').trim() ||
      (paymentStatus === CheckoutPaymentStatusEnum.CANCELLED
        ? 'Payment was cancelled before completion.'
        : paymentStatus === CheckoutPaymentStatusEnum.EXPIRED
          ? 'Payment window expired before completion.'
          : 'Payment failed before completion.');

    const bookingUpdateResult = await this.bookingRepository
      .createQueryBuilder()
      .update(BookingEntity)
      .set({
        status: BookingStatusEnum.CANCELLED,
        cancelled_at: now,
        cancelled_by: null,
        cancellation_reason: cancellationReason,
        updated_at: now,
      } as any)
      .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
      .andWhere('status IN (:...statuses)', {
        statuses: CANCELLABLE_GUEST_BOOKING_STATUSES,
      })
      .execute();

    await this.salesOrderRepository
      .createQueryBuilder()
      .update(SalesOrderEntity)
      .set({
        status: OrderStatusEnum.CANCELLED,
        payment_status: SalesOrderPaymentStatusEnum.FAILED,
        cancellation_reason: cancellationReason,
        cancelled_at: now,
        status_notes: cancellationReason,
        updated_at: now,
      } as any)
      .where('id IN (:...salesOrderIds)', { salesOrderIds })
      .andWhere('status IN (:...statuses)', {
        statuses: CANCELLABLE_GUEST_ORDER_STATUSES,
      })
      .execute();

    this.logger.log(
      `Cancelled guest bookings for payment=${payment.id}, status=${paymentStatus}, affected_bookings=${Number(bookingUpdateResult.affected || 0)}`,
    );
  }

  private async updateSalesOrderPaymentStatus(
    salesOrderId: number,
    paymentStatus: CheckoutPaymentStatusEnum,
  ): Promise<void> {
    let orderPaymentStatus: string;
    switch (paymentStatus) {
      case CheckoutPaymentStatusEnum.COMPLETED:
        orderPaymentStatus = SalesOrderPaymentStatusEnum.PAID;
        break;
      case CheckoutPaymentStatusEnum.FAILED:
        orderPaymentStatus = SalesOrderPaymentStatusEnum.FAILED;
        break;
      case CheckoutPaymentStatusEnum.CANCELLED:
        orderPaymentStatus = SalesOrderPaymentStatusEnum.FAILED;
        break;
      default:
        return; // No update needed for pending/unknown
    }

    const updateData: Record<string, any> = {
      payment_status: orderPaymentStatus,
    };

    // Auto-confirm: when payment succeeds and order is still pending,
    // move it directly to confirmed (no seller action needed).
    if (orderPaymentStatus === SalesOrderPaymentStatusEnum.PAID) {
      const order = await this.salesOrderRepository.findOne({
        where: { id: salesOrderId },
        select: ['id', 'status', 'seller_id', 'subtotal'],
      });
      if (order && order.status === OrderStatusEnum.PENDING) {
        updateData.status = OrderStatusEnum.CONFIRMED;
        this.logger.log(
          `Auto-confirming sales order ${salesOrderId} (payment received)`,
        );
        await this.salesOrderRepository.update(salesOrderId, updateData);
        this.orderTrackingService
          .createEvent(
            salesOrderId,
            OrderEventTypeEnum.ORDER_CONFIRMED,
            'Order confirmed after successful payment',
          )
          .catch((err) =>
            this.logger.error(
              `Failed to create ORDER_CONFIRMED event for order ${salesOrderId}`,
              err,
            ),
          );

        // Credit pending earnings to seller wallet
        if (order.seller_id) {
          const seller = await this.sellerRepository.findOne({
            where: { id: order.seller_id },
            select: ['commission_rate'],
          });
          const commissionRate = seller
            ? Number(seller.commission_rate ?? 0)
            : 0;
          this.walletTransactionService
            .creditPendingEarning({
              sellerId: order.seller_id,
              salesOrderId,
              grossAmount: order.subtotal,
              commissionRate,
            })
            .catch((err) =>
              this.logger.warn(
                `Failed to credit pending earning for seller ${order.seller_id}, order ${salesOrderId}: ${(err as Error).message}`,
              ),
            );
        }

        return;
      }
    }

    await this.salesOrderRepository.update(salesOrderId, updateData);
  }

  /**
   * Send notification when payment fails.
   * Handles both checkout order and sales order payments.
   */
  private async sendPaymentFailedNotification(
    payment: CheckoutPayment,
  ): Promise<void> {
    if (payment.sales_order_id) {
      // Sales order payment
      const salesOrder = await this.salesOrderRepository.findOne({
        where: { id: payment.sales_order_id },
        relations: ['user'],
      });
      if (salesOrder?.user) {
        await this.notificationsService.sendPaymentFailed(
          salesOrder.user.id,
          salesOrder.id,
          salesOrder.order_number,
          payment.failure_reason ?? undefined,
          true,
          salesOrder.user.email ?? undefined,
          `${salesOrder.user.first_name} ${salesOrder.user.last_name}`,
        );
      }
    } else if (payment.checkout_order_id) {
      // Checkout order payment (existing behavior)
      const order = await this.checkoutOrdersService.findByIdInternal(
        payment.checkout_order_id,
      );
      if (order?.user) {
        await this.notificationsService.sendPaymentFailed(
          order.user.id,
          order.id,
          order.order_number,
          payment.failure_reason ?? undefined,
          true,
          order.user.email ?? undefined,
          `${order.user.first_name} ${order.user.last_name}`,
        );
      }
    }
  }

  /**
   * Send notification when user submits a manual QR payment (AWAITING_PAYMENT).
   * Mirrors sendPaymentSuccessNotification() but for the submitted/pending state.
   */
  private async sendPaymentSubmittedNotification(
    payment: CheckoutPayment,
  ): Promise<void> {
    if (payment.sales_order_id) {
      const salesOrder = await this.salesOrderRepository.findOne({
        where: { id: payment.sales_order_id },
        relations: ['user', 'items'],
      });
      if (salesOrder?.user) {
        // Skip for service-only orders; booking-created email already notifies the customer
        const isServiceOnly =
          (salesOrder.items?.length ?? 0) > 0 &&
          salesOrder.items.every(
            (item) => item.item_type === CartItemTypeEnum.SERVICE,
          );
        if (!isServiceOnly) {
          await this.notificationsService.sendPaymentSubmitted(
            salesOrder.user.id,
            salesOrder.id,
            salesOrder.order_number,
            payment.amount,
            true,
            salesOrder.user.email ?? undefined,
            `${salesOrder.user.first_name} ${salesOrder.user.last_name}`,
          );
        }
      }
    } else if (payment.checkout_order_id) {
      const order = await this.checkoutOrdersService.findByIdInternal(
        payment.checkout_order_id,
      );
      if (order?.user) {
        await this.notificationsService.sendPaymentSubmitted(
          order.user.id,
          order.id,
          order.order_number,
          payment.amount,
          true,
          order.user.email ?? undefined,
          `${order.user.first_name} ${order.user.last_name}`,
        );
      }
    }
  }

  /**
   * Send notification when payment succeeds.
   * Handles both checkout order and sales order payments.
   */
  private async sendPaymentSuccessNotification(
    payment: CheckoutPayment,
  ): Promise<void> {
    if (payment.sales_order_id) {
      // Sales order payment
      const salesOrder = await this.salesOrderRepository.findOne({
        where: { id: payment.sales_order_id },
        relations: ['user'],
      });
      if (salesOrder?.user) {
        await this.notificationsService.sendPaymentSuccess(
          salesOrder.user.id,
          salesOrder.id,
          salesOrder.order_number,
          payment.amount,
          true,
          salesOrder.user.email ?? undefined,
          `${salesOrder.user.first_name} ${salesOrder.user.last_name}`,
        );
      }
    } else if (payment.checkout_order_id) {
      // Checkout order payment (existing behavior)
      const order = await this.checkoutOrdersService.findByIdInternal(
        payment.checkout_order_id,
      );
      if (order?.user) {
        await this.notificationsService.sendPaymentSuccess(
          order.user.id,
          order.id,
          order.order_number,
          payment.amount,
          true,
          order.user.email ?? undefined,
          `${order.user.first_name} ${order.user.last_name}`,
        );
      }
    }
  }

  /**
   * Process refund for a payment.
   *
   * @param id - Payment ID
   * @param amount - Refund amount (optional, defaults to full refund)
   * @param reason - Refund reason
   * @param user - Current authenticated user
   * @returns Updated payment
   */
  async processRefund(
    id: number,
    amount?: number,
    reason?: string,
    user?: User,
  ): Promise<CheckoutPayment> {
    if (!user) {
      throw new BadRequestException('User is required for refund processing');
    }
    // Use repository directly — seller initiates refund, so user ownership check
    // (buyer vs seller) would fail with findById's access guard.
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Checkout payment with ID ${id} not found`);
    }

    if (payment.status !== CheckoutPaymentStatusEnum.COMPLETED) {
      throw new BadRequestException(
        `Cannot refund payment with status: ${payment.status}`,
      );
    }

    if (payment.is_fully_refunded) {
      throw new BadRequestException('Payment is already fully refunded');
    }

    const refundAmount = amount || payment.amount - payment.total_refunded;

    const remaining =
      Math.round((payment.amount - payment.total_refunded) * 100) / 100;
    if (Math.round(refundAmount * 100) / 100 > remaining) {
      throw new BadRequestException('Refund amount exceeds available amount');
    }

    // Call Maya Refund API before the atomic DB update.
    // If Maya rejects the refund (insufficient balance, invalid state, etc.),
    // we throw before touching total_refunded — no inconsistency.
    let mayaRefundEntry: Record<string, any> | null = null;
    if (payment.payment_gateway === 'maya') {
      // Extract Maya's internal payment ID from the stored webhook payload.
      // Maya's refund endpoint requires the payment ID (not the checkout ID / txnid).
      const gatewayResponse = payment.gateway_response as Record<
        string,
        any
      > | null;
      // Try each known path where Maya stores the payment ID in the webhook payload.
      // gateway_reference_number is intentionally excluded — it holds the checkout
      // session ID, not the payment ID, and will cause Maya's refund API to reject.
      const mayaPaymentId =
        gatewayResponse?.id ||
        gatewayResponse?.paymentId ||
        gatewayResponse?.data?.id ||
        gatewayResponse?.data?.attributes?.id;

      if (mayaPaymentId) {
        this.logger.debug(
          `Maya refund: resolved payment ID "${mayaPaymentId}" for txn ${payment.transaction_number}`,
        );
      }

      if (!mayaPaymentId) {
        throw new BadRequestException(
          `Maya payment ID not found in gateway_response for payment ${payment.transaction_number}. ` +
            'Ensure the Maya webhook was received and stored before processing a refund.',
        );
      }

      const refundResult = await this.mayaCheckoutService.createRefund(
        String(mayaPaymentId),
        refundAmount,
        reason || `Refund for payment ${payment.transaction_number}`,
      );

      mayaRefundEntry = {
        refundId: refundResult.refundId,
        status: refundResult.status,
        amount: refundAmount,
        createdAt: new Date().toISOString(),
      };
    }

    const newTotalRefunded =
      Math.round((payment.total_refunded + refundAmount) * 100) / 100;
    const isFullyRefunded = newTotalRefunded >= payment.amount;
    const newStatus = isFullyRefunded
      ? CheckoutPaymentStatusEnum.FULLY_REFUNDED
      : CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED;

    // Atomic update: WHERE guard rejects if a concurrent refund already claimed the amount.
    const updated = await this.repository.atomicRefund(
      payment.id,
      refundAmount,
      isFullyRefunded,
      newStatus,
      user.id,
    );

    if (!updated) {
      throw new BadRequestException(
        'Refund amount exceeds available balance or payment was already fully refunded. ' +
          'Another refund may have been processed concurrently.',
      );
    }

    // Persist the Maya refund entry into gateway_response now that total_refunded
    // has been atomically claimed. A failure here is non-critical — the financial
    // record is already correct; only the audit trail entry is missing.
    if (mayaRefundEntry) {
      const existingGatewayResponse = (payment.gateway_response ||
        {}) as Record<string, any>;
      const updatedGatewayResponse = {
        ...existingGatewayResponse,
        refunds: [...(existingGatewayResponse.refunds || []), mayaRefundEntry],
      };
      await this.repository.update(payment.id, {
        gateway_response: updatedGatewayResponse,
      } as any);
    }

    return updated;
  }

  /**
   * Generate unique transaction number.
   *
   * Format: PAY-{timestamp_base36}-{6_random_chars}
   * Example: PAY-M5K8P2Q3-A7B9XZ
   *
   * Uses millisecond timestamp (base36) + 6 random alphanumeric chars
   * for billions of combinations. The DB UNIQUE constraint on
   * transaction_number is the final safety net against collisions.
   */
  private generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(8).toString('hex').toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  private async sendPaymentSuccessNotificationsForOrderIds(
    orderIds: number[],
  ): Promise<void> {
    if (orderIds.length === 0) {
      return;
    }

    const orders = await this.salesOrderRepository.find({
      where: { id: In(orderIds) },
      relations: ['user'],
    });

    await Promise.all(
      orders.map(async (order) => {
        if (!order.user) {
          return;
        }

        await this.notificationsService.sendPaymentSuccess(
          order.user.id,
          order.id,
          order.order_number,
          Number(order.total_amount),
          true,
          order.user.email ?? undefined,
          `${order.user.first_name} ${order.user.last_name}`,
        );
      }),
    );
  }

  /**
   * Find payment by ID.
   *
   * @param id - Payment ID
   * @param user - Current authenticated user (for authorization)
   * @returns Payment if found
   */
  async findById(id: number, user: User): Promise<CheckoutPayment> {
    const payment = await this.repository.findById(id);

    if (!payment) {
      throw new NotFoundException(`Checkout payment with ID ${id} not found`);
    }

    // Verify access through linked order
    if (payment.sales_order_id) {
      const salesOrder = await this.salesOrderRepository.findOne({
        where: { id: payment.sales_order_id },
      });
      if (!salesOrder || salesOrder.user_id !== user.id) {
        throw new NotFoundException(`Checkout payment with ID ${id} not found`);
      }
    } else if (payment.checkout_order_id) {
      await this.checkoutOrdersService.findById(
        payment.checkout_order_id,
        user,
      );
    }

    return payment;
  }

  /**
   * Find payments by sales order ID.
   *
   * @param salesOrderId - Sales order ID
   * @returns Array of payments
   */
  findPaymentsBySalesOrderId(salesOrderId: number): Promise<CheckoutPayment[]> {
    return this.repository.findBySalesOrderId(salesOrderId);
  }

  /**
   * Find payments by checkout order ID.
   *
   * @param checkoutOrderId - Checkout order ID
   * @param user - Current authenticated user
   * @returns Array of payments
   */
  async findByCheckoutOrderId(
    checkoutOrderId: number,
    user: User,
  ): Promise<CheckoutPayment[]> {
    // Verify order access
    await this.checkoutOrdersService.findById(checkoutOrderId, user);

    return this.repository.findByCheckoutOrderId(checkoutOrderId);
  }

  /**
   * Find all payments with pagination.
   *
   * @param query - Query parameters
   * @param user - Current authenticated user
   * @returns Paginated payments
   */
  async findAll(
    query: QueryCheckoutPaymentDto,
    user: User,
  ): Promise<IPaginatedResult<CheckoutPayment>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    const filterQuery: any = {};
    if (query.checkout_order_id) {
      // Verify order access
      await this.checkoutOrdersService.findById(query.checkout_order_id, user);
      filterQuery.checkout_order_id = query.checkout_order_id;
    }
    if (query.status) {
      filterQuery.status = query.status;
    }
    if (query.payment_method_code) {
      filterQuery.payment_method_code = query.payment_method_code;
    }

    return this.repository.findAllWithPagination({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Clear specific items from a user's shopping cart after successful payment.
   *
   * @param userId - Owner of the cart
   * @param snapshotItemIds - IDs of ShoppingCartItem rows that were checked out.
   *   When provided, only those items are removed so any items the user added
   *   *after* payment initiation are preserved. When null/empty, all items are
   *   removed (legacy order-first flow where no snapshot is available).
   * @private
   */
  private async clearUserCart(
    userId: number,
    snapshotItemIds: number[] | null,
  ): Promise<void> {
    try {
      // Find user's cart
      const cart = await this.shoppingCartRepository.findOne({
        where: { user_id: userId },
      });

      if (!cart) {
        this.logger.debug(`No cart found for user ${userId}, nothing to clear`);
        return;
      }

      if (snapshotItemIds && snapshotItemIds.length > 0) {
        // Only remove the items that were part of the checkout snapshot.
        // Items added after payment initiation are preserved.
        // Scoped to this user's cart_id to prevent cross-cart deletion.
        await this.shoppingCartItemRepository.delete({
          id: In(snapshotItemIds),
          shopping_cart_id: cart.id,
        });
        this.logger.log(
          `Cleared ${snapshotItemIds.length} snapshotted item(s) from cart for user ${userId}`,
        );
      } else {
        // Order-first flow — no snapshot available, clear everything.
        await this.shoppingCartItemRepository.delete({
          shopping_cart_id: cart.id,
        });
        this.logger.log(
          `Cleared all cart items for user ${userId} (cart_id: ${cart.id})`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to clear cart for user ${userId}`, error);
      // Don't throw - cart clearing is non-critical, payment already succeeded
    }
  }

  /**
   * Create sales orders from payment metadata after payment succeeds.
   * This is called for session-based payments where orders weren't created
   * until payment was confirmed.
   *
   * @param payment - The payment record with metadata containing cart data
   * @returns Created order IDs
   */
  private async createOrdersFromPaymentMetadata(
    payment: CheckoutPayment,
    initialPaymentStatus: 'paid' | 'awaiting_payment' = 'paid',
  ): Promise<number[]> {
    const metadata = (payment as any).metadata;
    if (!metadata || !metadata.cart_items) {
      this.logger.warn(
        `Payment ${payment.id} has no cart metadata, cannot create orders`,
      );
      return [];
    }

    // Serialize concurrent order-creation attempts for the same payment using
    // a Postgres transaction-scoped advisory lock. Without this, two concurrent
    // postbacks for the same checkout payment can both pass the "no linked
    // orders" check and each create a distinct set of sales orders, resulting
    // in duplicate orders and double-consumed inventory reservations.
    //
    // The lock auto-releases when the wrapping transaction commits or rolls back.
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
        CheckoutPaymentsService.ORDER_CREATION_LOCK_CLASSID,
        payment.id,
      ]);

      // Re-check inside the lock: another concurrent caller may have just
      // finished creating orders for this payment. Return their IDs so the
      // caller can continue idempotently.
      const existingLinks = await manager
        .getRepository(CheckoutPaymentOrderEntity)
        .find({ where: { checkout_payment_id: payment.id } });

      if (existingLinks.length > 0) {
        this.logger.log(
          `Payment ${payment.id} already has ${existingLinks.length} linked order(s); skipping duplicate creation`,
        );
        return existingLinks.map((link) => link.sales_order_id);
      }

      this.logger.log(
        `Creating orders from payment ${payment.id} metadata for user ${metadata.user_id} (status: ${initialPaymentStatus})`,
      );

      return this.salesOrdersService.createOrdersFromPaymentMetadata(
        payment,
        metadata,
        initialPaymentStatus,
      );
    });
  }

  /**
   * Find all payment records associated with a sales order ID.
   * Exposed for use by SalesOrdersService when switching payment methods.
   */
  async findBySalesOrderId(salesOrderId: number): Promise<CheckoutPayment[]> {
    return this.repository.findBySalesOrderId(salesOrderId);
  }

  /**
   * Poll payment status by transaction number for mobile polling.
   *
   * Maps internal CheckoutPaymentStatusEnum to the three mobile-facing states:
   *   'awaiting_payment' — still waiting (keep polling)
   *   'paid'             — payment confirmed, order(s) created
   *   'failed'           — payment failed or cancelled
   *
   * Also returns the IDs of any sales orders created for this payment,
   * so the mobile app can navigate to the order detail page on success.
   *
   * @param txnid - The payment transaction number (PAY-XXXXX)
   * @returns { status, order_ids }
   */
  async getPaymentStatusByTxnid(
    txnid: string,
  ): Promise<{ status: string; order_ids: number[] }> {
    const payment = await this.repository.findByTransactionNumber(txnid);

    if (!payment) {
      // Return awaiting so the mobile keeps polling briefly before giving up
      return { status: 'awaiting_payment', order_ids: [] };
    }

    // Map internal status → mobile-facing status
    let mobileStatus: string;
    const isManualGcash = payment.payment_gateway === 'qr_manual';
    switch (payment.status) {
      case CheckoutPaymentStatusEnum.COMPLETED:
        mobileStatus = 'paid';
        break;
      case CheckoutPaymentStatusEnum.FAILED:
      case CheckoutPaymentStatusEnum.CANCELLED:
      case CheckoutPaymentStatusEnum.EXPIRED:
        mobileStatus = 'failed';
        break;
      case CheckoutPaymentStatusEnum.AWAITING_PAYMENT:
        // Manual GCash proof uploaded — awaiting admin/seller confirmation.
        // Mobile shows "Payment under review" instead of a generic spinner.
        mobileStatus = isManualGcash
          ? 'awaiting_confirmation'
          : 'awaiting_payment';
        break;
      default:
        mobileStatus = 'awaiting_payment';
    }

    // Find all sales order IDs linked to this payment via join table
    const paymentOrders = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: payment.id },
    });
    const orderIds = paymentOrders.map((po) => po.sales_order_id);

    return { status: mobileStatus, order_ids: orderIds };
  }

  /**
   * Cancel a pending or awaiting payment record.
   * Used before initiating a replacement payment during method switch.
   * No-ops if the payment is already in a terminal state (COMPLETED, FAILED, etc.).
   */
  async cancelPayment(paymentId: number): Promise<void> {
    const payment = await this.repository.findById(paymentId);
    if (!payment) return;

    const cancellableStatuses: CheckoutPaymentStatusEnum[] = [
      CheckoutPaymentStatusEnum.PENDING,
      CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
    ];
    if (
      !cancellableStatuses.includes(payment.status as CheckoutPaymentStatusEnum)
    ) {
      this.logger.warn(
        `cancelPayment skipped — payment ${paymentId} has non-cancellable status: ${payment.status}`,
      );
      return;
    }

    await this.repository.update(paymentId, {
      status: CheckoutPaymentStatusEnum.CANCELLED,
    });
  }

  /**
   * Confirm a manual GCash payment (seller/owner action).
   * Transitions AWAITING_PAYMENT → COMPLETED and triggers order confirmation.
   */
  async confirmManualPayment(
    paymentId: number,
    confirmedBy: User,
  ): Promise<CheckoutPayment> {
    const payment = await this.repository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payment_gateway !== 'qr_manual') {
      throw new BadRequestException(
        'Manual confirmation is only available for GCash manual payments',
      );
    }

    if (payment.status !== CheckoutPaymentStatusEnum.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Payment cannot be confirmed — current status: ${payment.status}`,
      );
    }

    const now = new Date();
    await this.repository.update(paymentId, {
      status: CheckoutPaymentStatusEnum.COMPLETED,
      paid_at: now,
      metadata: {
        ...(payment as any).metadata,
        manual_confirmed_at: now.toISOString(),
        manual_confirmed_by: confirmedBy.id,
      },
    } as any);

    // Session-based flow (court bookings): no sales_order_id yet — create orders
    // from payment metadata exactly as the Maya webhook path does at line 832.
    if (!payment.sales_order_id) {
      try {
        const createdOrderIds =
          await this.createOrdersFromPaymentMetadata(payment);
        this.logger.log(
          `Manual confirm: created ${createdOrderIds.length} order(s) from payment ${paymentId} metadata`,
        );
        if (createdOrderIds.length > 0) {
          await this.sendPaymentSuccessNotificationsForOrderIds(
            createdOrderIds,
          );
        }
      } catch (error) {
        this.logger.error(
          `Manual confirm: failed to create orders from payment ${paymentId} metadata`,
          error,
        );
      }
    }

    // checkout_payment_orders link table (new flow) or direct sales_order_id (legacy).
    const linkedOrders = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: paymentId },
    });
    if (linkedOrders.length > 0) {
      for (const link of linkedOrders) {
        await this.updateSalesOrderPaymentStatus(
          link.sales_order_id,
          CheckoutPaymentStatusEnum.COMPLETED,
        );
      }
    } else if (payment.sales_order_id) {
      await this.updateSalesOrderPaymentStatus(
        payment.sales_order_id,
        CheckoutPaymentStatusEnum.COMPLETED,
      );
    }

    return this.repository.findById(paymentId) as Promise<CheckoutPayment>;
  }

  /**
   * Reject a manual GCash payment (seller/owner action).
   * Transitions AWAITING_PAYMENT → FAILED.
   */
  async rejectManualPayment(
    paymentId: number,
    rejectedBy: User,
    reason: string,
  ): Promise<CheckoutPayment> {
    const payment = await this.repository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payment_gateway !== 'qr_manual') {
      throw new BadRequestException(
        'Manual rejection is only available for GCash manual payments',
      );
    }

    if (payment.status !== CheckoutPaymentStatusEnum.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Payment cannot be rejected — current status: ${payment.status}`,
      );
    }

    const now = new Date();
    await this.repository.update(paymentId, {
      status: CheckoutPaymentStatusEnum.FAILED,
      failure_reason: reason,
      metadata: {
        ...(payment as any).metadata,
        manual_rejected_at: now.toISOString(),
        manual_rejected_by: rejectedBy.id,
        manual_rejection_reason: reason,
      },
    } as any);

    const updatedPayment = (await this.repository.findById(
      paymentId,
    )) as CheckoutPayment;

    // Notify user that payment was rejected (non-blocking)
    this.sendPaymentFailedNotification(updatedPayment).catch((error) => {
      this.logger.error('Failed to send payment rejection notification', error);
    });

    return updatedPayment;
  }

  /**
   * Get all sales order IDs linked to the same checkout payment as the given order.
   * Returns an empty array if no payment link is found (single-seller fallback).
   *
   * This handles multi-seller checkouts where one DragonPay payment covers multiple
   * seller orders. When retrying payment, the full combined amount must be recharged.
   */
  async getLinkedOrderIds(salesOrderId: number): Promise<number[]> {
    // Find the most recent active (non-cancelled, non-failed) payment linked to this order
    const paymentOrders = await this.paymentOrderRepository.find({
      where: { sales_order_id: salesOrderId },
      relations: ['checkout_payment'],
      order: { created_at: 'DESC' },
    });

    if (paymentOrders.length === 0) {
      return [];
    }

    // Only treat a payment as "active" if it is still in a retryable state.
    // COMPLETED payments belong to already-paid orders — exclude them so that
    // switchPaymentMethod never re-links or re-charges already-settled orders.
    const retryableStatuses = new Set([
      CheckoutPaymentStatusEnum.PENDING,
      CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
    ]);
    const activePaymentOrder = paymentOrders.find(
      (po) =>
        po.checkout_payment?.status != null &&
        retryableStatuses.has(po.checkout_payment.status),
    );

    if (!activePaymentOrder) {
      return [];
    }

    const paymentId = activePaymentOrder.checkout_payment_id;

    // Find all orders linked to that payment
    const allPaymentOrders = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: paymentId },
    });

    return allPaymentOrders.map((po) => po.sales_order_id);
  }

  async handleMayaWebhookAsync(
    payload: Record<string, any>,
    signature?: string,
  ): Promise<{ result: string }> {
    // 1) Verify signature + parse light payload shape (strict in non-mock mode)
    const event = this.mayaCheckoutService.processWebhook(payload, signature);

    // 2) Persist event as idempotency lock
    const webhookEvent = this.mayaWebhookEventRepository.create({
      provider_event_id: event.eventId,
      event_type: event.eventType,
      txnid: event.txnid,
      signature: signature || null,
      payload: event.raw,
      status: 'pending',
    });

    let savedEvent: MayaWebhookEventEntity;
    try {
      savedEvent = await this.mayaWebhookEventRepository.save(webhookEvent);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === '23505'
      ) {
        this.logger.log(
          `Ignoring duplicate Maya webhook event: ${event.eventId}`,
        );
        await this.mayaWebhookEventRepository
          .createQueryBuilder()
          .update(MayaWebhookEventEntity)
          .set({
            last_duplicate_at: () => 'NOW()',
            duplicate_count: () => '"duplicate_count" + 1',
          })
          .where('provider_event_id = :providerEventId', {
            providerEventId: event.eventId,
          })
          .execute();
        return { result: 'OK' };
      }
      throw error;
    }

    // 3) Fast-ack strategy: process heavy logic in background
    setImmediate(() => {
      this.processMayaWebhookEvent(savedEvent.id, event).catch((err) => {
        this.logger.error(
          `Failed processing Maya webhook event ${savedEvent.id}: ${err?.message || err}`,
        );
      });
    });

    return { result: 'OK' };
  }

  async reprocessMayaWebhookEventById(eventRecordId: number): Promise<void> {
    const eventRecord = await this.mayaWebhookEventRepository.findOne({
      where: { id: eventRecordId },
    });
    if (!eventRecord) {
      throw new NotFoundException(
        `Maya webhook event ${eventRecordId} not found`,
      );
    }

    const event = this.mayaCheckoutService.parseWebhookPayload(
      eventRecord.payload || {},
    );
    await this.processMayaWebhookEvent(eventRecord.id, event);
  }

  async getMayaWebhookMetricsSnapshot(windowMinutes = 60): Promise<{
    windowStart: Date;
    duplicateCount: number;
    failedCount: number;
    avgProcessingLatencyMs: number;
  }> {
    const safeWindowMinutes =
      Number.isFinite(windowMinutes) && windowMinutes > 0 ? windowMinutes : 60;
    const windowStart = new Date(Date.now() - safeWindowMinutes * 60 * 1000);

    const failedCount = await this.mayaWebhookEventRepository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: 'failed' })
      .andWhere('event.created_at >= :windowStart', { windowStart })
      .getCount();

    const duplicateRaw = await this.mayaWebhookEventRepository
      .createQueryBuilder('event')
      .select('COALESCE(SUM(event.duplicate_count), 0)', 'duplicate_count')
      .where(
        '(event.created_at >= :windowStart OR event.last_duplicate_at >= :windowStart)',
        { windowStart },
      )
      .getRawOne<{ duplicate_count: string }>();

    const latencyRaw = await this.mayaWebhookEventRepository
      .createQueryBuilder('event')
      .select('COALESCE(AVG(event.processing_latency_ms), 0)', 'avg_latency')
      .where('event.processed_at >= :windowStart', { windowStart })
      .andWhere('event.processing_latency_ms IS NOT NULL')
      .getRawOne<{ avg_latency: string }>();

    return {
      windowStart,
      duplicateCount: Number(duplicateRaw?.duplicate_count || 0),
      failedCount,
      avgProcessingLatencyMs: Math.round(Number(latencyRaw?.avg_latency || 0)),
    };
  }

  async handleMayaMockCallback(input: {
    txnid: string;
    status:
      | 'success'
      | 'authorized'
      | 'captured'
      | 'failed'
      | 'cancelled'
      | 'pending';
  }): Promise<{ result: string; referenceNumber: string | null }> {
    const referenceNumber = `MAYA-MOCK-${input.txnid}`;
    await this.applyMayaPaymentResult({
      txnid: input.txnid,
      status: input.status,
      referenceNumber,
      failureReason:
        input.status === 'failed' ? 'Payment failed in mock Maya mode' : null,
      gatewayPayload: { source: 'maya_mock', ...input },
    });
    return { result: 'OK', referenceNumber };
  }

  private async processMayaWebhookEvent(
    eventRecordId: number,
    event: {
      txnid: string;
      status:
        | 'success'
        | 'authorized'
        | 'captured'
        | 'failed'
        | 'cancelled'
        | 'pending';
      referenceNumber: string | null;
      failureReason?: string;
      raw: Record<string, any>;
    },
  ): Promise<void> {
    const startedAt = new Date();
    await this.mayaWebhookEventRepository.update(eventRecordId, {
      status: 'processing',
      processing_started_at: startedAt,
      processed_at: null,
      processing_latency_ms: null,
    });

    try {
      await this.applyMayaPaymentResult({
        txnid: event.txnid,
        status: event.status,
        referenceNumber: event.referenceNumber,
        failureReason: event.failureReason,
        gatewayPayload: event.raw,
      });

      await this.mayaWebhookEventRepository.update(eventRecordId, {
        status: 'completed',
        processed_at: new Date(),
        processing_latency_ms: Date.now() - startedAt.getTime(),
        error_message: null,
        next_retry_at: null,
      });
    } catch (error) {
      await this.mayaWebhookEventRepository.update(eventRecordId, {
        status: 'failed',
        processed_at: new Date(),
        processing_latency_ms: Date.now() - startedAt.getTime(),
        error_message:
          error instanceof Error ? error.message : 'Unknown processing error',
      });
      throw error;
    }
  }

  private async applyMayaPaymentResult(params: {
    txnid: string;
    status:
      | 'success'
      | 'authorized'
      | 'captured'
      | 'failed'
      | 'cancelled'
      | 'pending';
    referenceNumber: string | null;
    failureReason?: string | null;
    gatewayPayload: Record<string, any>;
  }): Promise<void> {
    const payment = await this.repository.findByTransactionNumber(params.txnid);
    if (!payment) {
      throw new NotFoundException(
        `Payment with txnid ${params.txnid} not found`,
      );
    }

    const terminalStatuses = [
      CheckoutPaymentStatusEnum.COMPLETED,
      CheckoutPaymentStatusEnum.FULLY_REFUNDED,
    ];
    const isAlreadyTerminal = terminalStatuses.includes(
      payment.status as CheckoutPaymentStatusEnum,
    );
    let updated = payment;

    if (!isAlreadyTerminal) {
      const updateData: Partial<CheckoutPayment> = {
        gateway_reference_number: params.referenceNumber,
        gateway_response: params.gatewayPayload as any,
        updated_at: new Date(),
      };

      if (params.status === 'success') {
        updateData.status = CheckoutPaymentStatusEnum.COMPLETED;
        updateData.paid_at = new Date();
      } else if (params.status === 'authorized') {
        updateData.status = CheckoutPaymentStatusEnum.AUTHORIZED;
      } else if (params.status === 'captured') {
        updateData.status = CheckoutPaymentStatusEnum.CAPTURED;
      } else if (params.status === 'failed') {
        updateData.status = CheckoutPaymentStatusEnum.FAILED;
        updateData.failure_reason =
          params.failureReason || 'Maya payment failed';
      } else if (params.status === 'cancelled') {
        updateData.status = CheckoutPaymentStatusEnum.CANCELLED;
      }

      updated = await this.repository.update(payment.id, updateData);
    }

    let createdOrderIds: number[] = [];
    if (
      updated.status === CheckoutPaymentStatusEnum.COMPLETED &&
      !payment.sales_order_id
    ) {
      createdOrderIds = await this.createOrdersFromPaymentMetadata(payment);
      if (createdOrderIds.length > 0) {
        await this.sendPaymentSuccessNotificationsForOrderIds(createdOrderIds);
      }
    }

    const linkedOrders = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: payment.id },
    });
    if (linkedOrders.length > 0) {
      for (const link of linkedOrders) {
        await this.updateSalesOrderPaymentStatus(
          link.sales_order_id,
          updated.status,
        );
      }
    } else if (payment.sales_order_id) {
      // Direct-link fallback: no checkout_payment_orders rows exist (legacy path),
      // but the payment is linked via the sales_order_id column directly.
      await this.updateSalesOrderPaymentStatus(
        payment.sales_order_id,
        updated.status,
      );
    }

    await this.cancelGuestBookingsForTerminalPayment({
      payment,
      paymentStatus: updated.status,
      reason: params.failureReason || null,
    });

    if (updated.status === CheckoutPaymentStatusEnum.COMPLETED) {
      const canClearCart =
        !!payment.sales_order_id ||
        linkedOrders.length > 0 ||
        createdOrderIds.length > 0;
      if (canClearCart) {
        let userIdToClear: number | null = null;
        if (linkedOrders.length > 0) {
          const firstOrder = await this.salesOrderRepository.findOne({
            where: { id: linkedOrders[0].sales_order_id },
            select: ['id', 'user_id'],
          });
          userIdToClear = firstOrder?.user_id ?? null;
        } else {
          const paymentMetadata = (payment as any).metadata;
          userIdToClear = paymentMetadata?.user_id ?? null;
        }
        if (userIdToClear) {
          const paymentMetadata = (payment as any).metadata;
          const snapshotItemIds: number[] | null = Array.isArray(
            paymentMetadata?.cart_items,
          )
            ? paymentMetadata.cart_items
                .map((item: any) => item.id)
                .filter((id: any) => typeof id === 'number' && id > 0)
            : null;
          await this.clearUserCart(userIdToClear, snapshotItemIds);
        }
      }
      await this.sendPaymentSuccessNotification(updated);
    } else if (updated.status === CheckoutPaymentStatusEnum.FAILED) {
      await this.sendPaymentFailedNotification(updated);
    }

    // Release reserved stock for session-flow payments (no order) that failed or were cancelled.
    // Stock was reserved in createCheckoutSessionFlow() — release it so items are available again.
    const isFailedOrCancelled =
      updated.status === CheckoutPaymentStatusEnum.FAILED ||
      updated.status === CheckoutPaymentStatusEnum.CANCELLED;
    const isSessionFlow = !payment.sales_order_id && linkedOrders.length === 0;
    if (isFailedOrCancelled && isSessionFlow) {
      const paymentMetadata = (payment as any).metadata;
      const cartItems: { variant_id: number | null; quantity: number }[] =
        Array.isArray(paymentMetadata?.cart_items)
          ? paymentMetadata.cart_items
          : [];
      for (const item of cartItems) {
        if (item.variant_id) {
          try {
            await this.inventoryStocksService.releaseStock(
              item.variant_id,
              item.quantity,
              null as any,
            );
          } catch (err) {
            this.logger.error(
              `Failed to release stock for variant ${item.variant_id} on payment ${payment.id}: ${(err as Error).message}`,
            );
          }
        }
      }
    }
  }

  private computeEmailSlotCount(input: {
    scheduledStartTime: string;
    scheduledEndTime: string;
    slotDurationMinutes: number;
  }): number {
    const startMinutes = this.parseEmailTimeToMinutes(input.scheduledStartTime);
    const endMinutes = this.parseEmailTimeToMinutes(
      input.scheduledEndTime || input.scheduledStartTime,
    );
    if (startMinutes === null || endMinutes === null) {
      return 1;
    }

    const durationMinutes = endMinutes - startMinutes;
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return 1;
    }

    const slotDuration = this.resolveEmailSlotDurationMinutes(
      input.slotDurationMinutes,
    );
    const slotCount = Math.ceil(durationMinutes / slotDuration);
    if (!Number.isFinite(slotCount) || slotCount <= 0) {
      return 1;
    }

    return slotCount;
  }

  private resolveEmailSlotDurationMinutes(value: unknown): number {
    const normalized = Number(value ?? 0);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 60;
    }
    return normalized;
  }

  private parseEmailTimeToMinutes(value: string): number | null {
    const raw = String(value || '').trim();
    if (!raw) {
      return null;
    }

    const twentyFourHourMatch = raw.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/,
    );
    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);
      const seconds = Number(twentyFourHourMatch[3] ?? 0);
      const isValidMidnightBoundary =
        hours === 24 && minutes === 0 && seconds === 0;
      if (
        Number.isFinite(hours) &&
        Number.isFinite(minutes) &&
        Number.isFinite(seconds) &&
        hours >= 0 &&
        hours <= 24 &&
        minutes >= 0 &&
        minutes <= 59 &&
        seconds >= 0 &&
        seconds <= 59 &&
        (hours < 24 || isValidMidnightBoundary)
      ) {
        return hours * 60 + minutes + seconds / 60;
      }
      return null;
    }

    const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!twelveHourMatch) {
      return null;
    }

    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = String(twelveHourMatch[3] || '').toUpperCase();
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }
}
