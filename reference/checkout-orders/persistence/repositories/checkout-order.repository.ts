import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCheckoutOrderRepository } from '../base-checkout-order.repository';
import { CheckoutOrderEntity } from '../entities/checkout-order.entity';
import { CheckoutOrder } from '@/checkout-orders/domain/checkout-order';
import { CheckoutOrderMapper } from '../mappers/checkout-order.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Concrete implementation of checkout order repository.
 *
 * Handles database operations for checkout orders using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class CheckoutOrderRepository extends BaseCheckoutOrderRepository {
  constructor(
    @InjectRepository(CheckoutOrderEntity)
    private readonly repository: Repository<CheckoutOrderEntity>,
  ) {
    super();
  }

  /**
   * Create a new checkout order.
   *
   * @param order - Checkout order domain model to create
   * @returns Promise<CheckoutOrder> - Created checkout order
   */
  async create(order: CheckoutOrder): Promise<CheckoutOrder> {
    const persistenceEntity = CheckoutOrderMapper.toPersistence(order);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<CheckoutOrder>;
  }

  /**
   * Find checkout orders with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<CheckoutOrder>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CheckoutOrder>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: [
        'user',
        'currency',
        'delivery_address',
        'service_address',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => CheckoutOrderMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all checkout orders with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<CheckoutOrder>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<CheckoutOrder>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    // Add filter logic here if needed

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'user',
        'currency',
        'delivery_address',
        'service_address',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => CheckoutOrderMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find a checkout order by ID.
   *
   * @param id - The checkout order ID
   * @returns Promise<CheckoutOrder | null> - Order if found, null otherwise
   */
  async findById(id: number): Promise<CheckoutOrder | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'user',
        'currency',
        'delivery_address',
        'service_address',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entity ? CheckoutOrderMapper.toDomain(entity) : null;
  }

  /**
   * Find a checkout order by order number.
   *
   * @param orderNumber - The order number (e.g., 'ORD-20241211-1234')
   * @returns Promise<CheckoutOrder | null> - Order if found, null otherwise
   */
  async findByOrderNumber(orderNumber: string): Promise<CheckoutOrder | null> {
    const entity = await this.repository.findOne({
      where: { order_number: orderNumber },
      relations: [
        'user',
        'currency',
        'delivery_address',
        'service_address',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? CheckoutOrderMapper.toDomain(entity) : null;
  }

  /**
   * Find checkout orders by user ID.
   *
   * @param userId - The user's ID
   * @param paginationOptions - Pagination options
   * @returns Promise<IPaginatedResult<CheckoutOrder>> - Paginated orders
   */
  async findByUserId(
    userId: number,
    paginationOptions: IPaginationOptions,
  ): Promise<IPaginatedResult<CheckoutOrder>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repository.findAndCount({
      where: { user_id: userId },
      relations: [
        'user',
        'currency',
        'delivery_address',
        'service_address',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => CheckoutOrderMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Update a checkout order.
   *
   * @param id - The checkout order ID
   * @param payload - Partial order data to update
   * @returns Promise<CheckoutOrder> - Updated checkout order
   */
  async update(
    id: number,
    payload: Partial<CheckoutOrder>,
  ): Promise<CheckoutOrder> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Checkout order with ID ${id} not found`);
    }

    const updateData = CheckoutOrderMapper.toPersistence({
      ...CheckoutOrderMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<CheckoutOrder>;
  }

  /**
   * Soft delete a checkout order.
   *
   * @param id - The checkout order ID
   * @returns Promise<void>
   */
  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
