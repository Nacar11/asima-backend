import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCheckoutPaymentRepository } from '../base-checkout-payment.repository';
import { CheckoutPaymentEntity } from '../entities/checkout-payment.entity';
import { CheckoutPayment } from '@/checkout-payments/domain/checkout-payment';
import { CheckoutPaymentMapper } from '../mappers/checkout-payment.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';

/**
 * Concrete implementation of checkout payment repository.
 *
 * Handles database operations for checkout payments using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class CheckoutPaymentRepository extends BaseCheckoutPaymentRepository {
  constructor(
    @InjectRepository(CheckoutPaymentEntity)
    private readonly repository: Repository<CheckoutPaymentEntity>,
  ) {
    super();
  }

  /**
   * Create a new checkout payment.
   *
   * @param payment - Checkout payment domain model to create
   * @returns Promise<CheckoutPayment> - Created checkout payment
   */
  async create(payment: CheckoutPayment): Promise<CheckoutPayment> {
    const persistenceEntity = CheckoutPaymentMapper.toPersistence(payment);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<CheckoutPayment>;
  }

  /**
   * Find checkout payments with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<CheckoutPayment>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CheckoutPayment>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => CheckoutPaymentMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all checkout payments with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<CheckoutPayment>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<CheckoutPayment>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.filterQuery?.checkout_order_id) {
      whereClause.checkout_order_id = options.filterQuery.checkout_order_id;
    }
    if (options.filterQuery?.status) {
      whereClause.status = options.filterQuery.status;
    }
    if (options.filterQuery?.payment_method_code) {
      whereClause.payment_method_code = options.filterQuery.payment_method_code;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => CheckoutPaymentMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find a checkout payment by ID.
   *
   * @param id - The checkout payment ID
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  async findById(id: number): Promise<CheckoutPayment | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? CheckoutPaymentMapper.toDomain(entity) : null;
  }

  /**
   * Find a checkout payment by gateway reference number.
   *
   * @param gatewayReferenceNumber - The gateway reference number
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  async findByGatewayReferenceNumber(
    gatewayReferenceNumber: string,
  ): Promise<CheckoutPayment | null> {
    const entity = await this.repository.findOne({
      where: { gateway_reference_number: gatewayReferenceNumber },
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? CheckoutPaymentMapper.toDomain(entity) : null;
  }

  /**
   * Find checkout payments by checkout order ID.
   *
   * @param checkoutOrderId - The checkout order ID
   * @returns Promise<CheckoutPayment[]> - Array of payments for the checkout order
   */
  async findByCheckoutOrderId(
    checkoutOrderId: number,
  ): Promise<CheckoutPayment[]> {
    const entities = await this.repository.find({
      where: { checkout_order_id: checkoutOrderId },
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => CheckoutPaymentMapper.toDomain(entity));
  }

  async findPendingSessionPaymentByIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<CheckoutPayment | null> {
    const entity = await this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.checkout_order', 'checkout_order')
      .leftJoinAndSelect('payment.currency', 'currency')
      .leftJoinAndSelect('payment.created_by', 'created_by')
      .leftJoinAndSelect('payment.updated_by', 'updated_by')
      .where("payment.metadata->>'idempotency_key' = :idempotencyKey", {
        idempotencyKey,
      })
      .andWhere("payment.metadata->>'user_id' = :userId", {
        userId: String(userId),
      })
      .andWhere('payment.sales_order_id IS NULL')
      .andWhere('payment.checkout_order_id IS NULL')
      .andWhere('payment.status IN (:...statuses)', {
        statuses: [
          CheckoutPaymentStatusEnum.PENDING,
          CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
        ],
      })
      .orderBy('payment.created_at', 'DESC')
      .getOne();

    return entity ? CheckoutPaymentMapper.toDomain(entity) : null;
  }

  /**
   * Find checkout payments by sales order ID.
   *
   * Checks both the join table (new multi-seller records) and the legacy
   * sales_order_id column (pre-migration records) via OR so that orders
   * placed before the checkout_payment_orders table existed are still found.
   *
   * @param salesOrderId - The sales order ID
   * @returns Promise<CheckoutPayment[]>
   */
  async findBySalesOrderId(salesOrderId: number): Promise<CheckoutPayment[]> {
    const entities = await this.repository
      .createQueryBuilder('payment')
      .leftJoin('payment.payment_orders', 'po')
      .leftJoinAndSelect('payment.checkout_order', 'checkout_order')
      .leftJoinAndSelect('payment.currency', 'currency')
      .leftJoinAndSelect('payment.created_by', 'created_by')
      .leftJoinAndSelect('payment.updated_by', 'updated_by')
      .where('po.sales_order_id = :salesOrderId', { salesOrderId })
      .orWhere('payment.sales_order_id = :salesOrderId', { salesOrderId })
      .orderBy('payment.created_at', 'DESC')
      .getMany();

    return entities.map((entity) => CheckoutPaymentMapper.toDomain(entity));
  }

  /**
   * Find a checkout payment by transaction number.
   *
   * @param transactionNumber - The transaction number
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  async findByTransactionNumber(
    transactionNumber: string,
  ): Promise<CheckoutPayment | null> {
    const entity = await this.repository.findOne({
      where: { transaction_number: transactionNumber },
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? CheckoutPaymentMapper.toDomain(entity) : null;
  }

  /**
   * Find checkout payment by gateway transaction ID.
   *
   * @param gatewayTransactionId - The gateway transaction ID
   * @returns Promise<CheckoutPayment | null> - Payment if found, null otherwise
   */
  async findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<CheckoutPayment | null> {
    const entity = await this.repository.findOne({
      where: { gateway_transaction_id: gatewayTransactionId },
      relations: ['checkout_order', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? CheckoutPaymentMapper.toDomain(entity) : null;
  }

  /**
   * Update a checkout payment.
   *
   * @param id - The checkout payment ID
   * @param payload - Partial payment data to update
   * @returns Promise<CheckoutPayment> - Updated payment
   */
  async update(
    id: number,
    payload: Partial<CheckoutPayment>,
  ): Promise<CheckoutPayment> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Checkout payment with ID ${id} not found`);
    }

    const updateData = CheckoutPaymentMapper.toPersistence({
      ...CheckoutPaymentMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<CheckoutPayment>;
  }

  /**
   * Atomic refund: updates total_refunded only when total_refunded + refundAmount <= amount.
   * Uses a single UPDATE with a DB-evaluated WHERE guard to prevent concurrent double-refunds.
   */
  async atomicRefund(
    id: number,
    refundAmount: number,
    isFullyRefunded: boolean,
    newStatus: string,
    updatedById: number,
  ): Promise<CheckoutPayment | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(CheckoutPaymentEntity)
      .set({
        total_refunded: () => `total_refunded + ${refundAmount}`,
        refund_count: () => 'refund_count + 1',
        last_refund_at: new Date(),
        is_fully_refunded: isFullyRefunded,
        status: newStatus as CheckoutPaymentStatusEnum,
        updated_by: { id: updatedById } as any,
      })
      .where('id = :id', { id })
      .andWhere('is_fully_refunded = false')
      .andWhere(
        'ROUND(CAST(total_refunded + :refundAmount AS numeric), 2) <= ROUND(CAST(amount AS numeric), 2)',
        { refundAmount },
      )
      .execute();

    if (!result.affected) {
      return null;
    }

    return this.findById(id);
  }

  async transitionToAwaitingPaymentIfPending(
    id: number,
    gatewayReferenceNumber: string | null,
    gatewayCheckoutUrl: string | null,
  ): Promise<CheckoutPayment> {
    await this.repository
      .createQueryBuilder()
      .update(CheckoutPaymentEntity)
      .set({
        gateway_reference_number: gatewayReferenceNumber,
        gateway_checkout_url: gatewayCheckoutUrl,
        status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      })
      .where('id = :id', { id })
      .andWhere('status = :pendingStatus', {
        pendingStatus: CheckoutPaymentStatusEnum.PENDING,
      })
      .execute();

    const payment = await this.findById(id);
    if (!payment) {
      throw new Error(`Checkout payment with ID ${id} not found`);
    }

    return payment;
  }
}
