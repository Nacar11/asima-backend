import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Brackets } from 'typeorm';
import {
  BaseSalesOrderRepository,
  PaginatedSalesOrders,
} from '../base-sales-order.repository';
import { SalesOrderEntity } from '../entities/sales-order.entity';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { SalesOrderMapper } from '../mappers/sales-order.mapper';
import { QuerySalesOrderDto } from '@/sales-orders/dto/query-sales-order.dto';

/**
 * Concrete implementation of SalesOrder repository
 */
@Injectable()
export class SalesOrderRepository implements BaseSalesOrderRepository {
  constructor(
    @InjectRepository(SalesOrderEntity)
    private readonly repository: Repository<SalesOrderEntity>,
  ) {}

  /**
   * Create a new sales order
   */
  async create(data: SalesOrder): Promise<SalesOrder> {
    const persistenceEntity = SalesOrderMapper.toPersistence(data);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<SalesOrder>;
  }

  /**
   * Find sales order by ID
   */
  async findById(id: number): Promise<SalesOrder | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'user',
        'seller',
        'seller.pickup_address_entity',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.seller',
        'items.variant.media',
        'items.variant.product.product_media_mappings',
        'items.variant.product.product_media_mappings.media',
        'items.service',
        'items.service.seller',
        'items.package',
        'items.service_address',
        'items.addons',
        'items.options',
        'items.reviews',
        'created_by',
        'updated_by',
      ],
    });

    if (!entity) {
      return null;
    }

    return SalesOrderMapper.toDomain(entity);
  }

  /**
   * Find sales order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    const entity = await this.repository.findOne({
      where: { order_number: orderNumber },
      relations: [
        'user',
        'seller',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.seller',
        'items.variant.media',
        'items.variant.product.product_media_mappings',
        'items.variant.product.product_media_mappings.media',
        'items.service',
        'items.service.seller',
        'items.package',
        'items.service_address',
        'items.addons',
        'items.options',
        'items.reviews',
        'created_by',
        'updated_by',
      ],
    });

    if (!entity) {
      return null;
    }

    return SalesOrderMapper.toDomain(entity);
  }

  /**
   * Find sales order by idempotency key and user ID
   */
  async findByIdempotencyKey(
    idempotencyKey: string,
    userId: number,
  ): Promise<SalesOrder | null> {
    const entity = await this.repository.findOne({
      where: { idempotency_key: idempotencyKey, user_id: userId },
      withDeleted: true,
      relations: [
        'user',
        'seller',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.seller',
        'items.variant.media',
        'items.variant.product.product_media_mappings',
        'items.variant.product.product_media_mappings.media',
        'items.service',
        'items.service.seller',
        'items.package',
        'items.service_address',
        'items.addons',
        'items.options',
        'items.reviews',
        'created_by',
        'updated_by',
      ],
    });

    if (!entity) {
      return null;
    }

    return SalesOrderMapper.toDomain(entity);
  }

  /**
   * Find all orders for a user with pagination
   */
  async findByUserId(
    userId: number,
    query: QuerySalesOrderDto,
  ): Promise<PaginatedSalesOrders> {
    const {
      page = 1,
      limit = 20,
      status,
      payment_status,
      sort_by = 'created_at',
      sort_order = 'DESC',
      search,
      fulfillment_type,
    } = query;
    const skip = (page - 1) * limit;

    if (search) {
      const qb = this.repository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.seller', 'seller')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .leftJoinAndSelect('product.seller', 'productSeller')
        .leftJoinAndSelect('variant.media', 'variantMedia')
        .leftJoinAndSelect(
          'product.product_media_mappings',
          'productMediaMappings',
        )
        .leftJoinAndSelect('productMediaMappings.media', 'productMedia')
        .leftJoinAndSelect('items.service', 'service')
        .leftJoinAndSelect('service.seller', 'serviceSeller')
        .leftJoinAndSelect('items.package', 'package')
        .leftJoinAndSelect('items.service_address', 'serviceAddress')
        .leftJoinAndSelect('items.addons', 'addons')
        .leftJoinAndSelect('items.options', 'options')
        .leftJoinAndSelect('items.reviews', 'reviews')
        .leftJoinAndSelect('order.created_by', 'createdBy')
        .where('order.user_id = :userId', { userId })
        .andWhere('order.checkout_source = :checkoutSource', {
          checkoutSource: 'ekumpra',
        })
        .andWhere(
          new Brackets((qb) => {
            const isNumeric = /^\d+$/.test(search);

            if (isNumeric) {
              // Numeric search: match exact order ID only
              qb.where('order.id = :numericSearch', {
                numericSearch: Number(search),
              });
            } else {
              // Text search: match across order_number, product name, store name, service title
              qb.where('order.order_number ILIKE :search', {
                search: `%${search}%`,
              })
                .orWhere('product.product_name ILIKE :search', {
                  search: `%${search}%`,
                })
                .orWhere('seller.store_name ILIKE :search', {
                  search: `%${search}%`,
                })
                .orWhere('service.title ILIKE :search', {
                  search: `%${search}%`,
                });
            }
          }),
        );

      if (status && status.length > 0) {
        qb.andWhere('order.status IN (:...statuses)', { statuses: status });
      }

      if (payment_status && payment_status.length > 0) {
        qb.andWhere('order.payment_status IN (:...paymentStatuses)', {
          paymentStatuses: payment_status,
        });
      }

      if (fulfillment_type) {
        qb.andWhere('order.fulfillment_type = :fulfillmentType', {
          fulfillmentType: fulfillment_type,
        });
      }

      if (fulfillment_type === 'pickup') {
        qb.addSelect(
          `CASE "order"."status" WHEN 'pending' THEN 1 WHEN 'confirmed' THEN 2 WHEN 'processing' THEN 3 WHEN 'ready_for_pickup' THEN 4 WHEN 'completed' THEN 5 WHEN 'cancelled' THEN 6 ELSE 7 END`,
          'status_order',
        ).addOrderBy('status_order', 'ASC');
      } else {
        qb.orderBy(`order.${sort_by}`, sort_order);
      }

      qb.skip(skip).take(limit);

      const [entities, total] = await qb.getManyAndCount();

      return {
        data: entities.map((entity) => SalesOrderMapper.toDomain(entity)),
        total,
        page,
        limit,
      };
    } else {
      if (fulfillment_type === 'pickup') {
        const qb = this.repository
          .createQueryBuilder('order')
          .leftJoinAndSelect('order.user', 'user')
          .leftJoinAndSelect('order.seller', 'seller')
          .leftJoinAndSelect('order.items', 'items')
          .leftJoinAndSelect('items.variant', 'variant')
          .leftJoinAndSelect('variant.product', 'product')
          .leftJoinAndSelect('product.seller', 'productSeller')
          .leftJoinAndSelect('variant.media', 'variantMedia')
          .leftJoinAndSelect(
            'product.product_media_mappings',
            'productMediaMappings',
          )
          .leftJoinAndSelect('productMediaMappings.media', 'productMedia')
          .leftJoinAndSelect('items.service', 'service')
          .leftJoinAndSelect('service.seller', 'serviceSeller')
          .leftJoinAndSelect('items.package', 'package')
          .leftJoinAndSelect('items.service_address', 'serviceAddress')
          .leftJoinAndSelect('items.addons', 'addons')
          .leftJoinAndSelect('items.options', 'options')
          .leftJoinAndSelect('items.reviews', 'reviews')
          .leftJoinAndSelect('order.created_by', 'createdBy')
          .where('order.user_id = :userId', { userId })
          .andWhere('order.checkout_source = :checkoutSource', {
            checkoutSource: 'ekumpra',
          })
          .andWhere('order.fulfillment_type = :fulfillmentType', {
            fulfillmentType: fulfillment_type,
          });

        if (status && status.length > 0) {
          qb.andWhere('order.status IN (:...statuses)', { statuses: status });
        }
        if (payment_status && payment_status.length > 0) {
          qb.andWhere('order.payment_status IN (:...paymentStatuses)', {
            paymentStatuses: payment_status,
          });
        }

        qb.addSelect(
          `CASE "order"."status" WHEN 'pending' THEN 1 WHEN 'confirmed' THEN 2 WHEN 'processing' THEN 3 WHEN 'ready_for_pickup' THEN 4 WHEN 'completed' THEN 5 WHEN 'cancelled' THEN 6 ELSE 7 END`,
          'status_order',
        )
          .addOrderBy('status_order', 'ASC')
          .skip(skip)
          .take(limit);

        const [entities, total] = await qb.getManyAndCount();

        return {
          data: entities.map((entity) => SalesOrderMapper.toDomain(entity)),
          total,
          page,
          limit,
        };
      }

      const whereClause: any = {
        user_id: userId,
        checkout_source: 'ekumpra',
      };
      if (status && status.length > 0) {
        whereClause.status = In(status);
      }
      if (payment_status && payment_status.length > 0) {
        whereClause.payment_status = In(payment_status);
      }
      if (fulfillment_type) {
        whereClause.fulfillment_type = fulfillment_type;
      }

      const [entities, total] = await this.repository.findAndCount({
        where: whereClause,
        relations: [
          'user',
          'seller',
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.product.seller',
          'items.variant.media',
          'items.variant.product.product_media_mappings',
          'items.variant.product.product_media_mappings.media',
          'items.service',
          'items.service.seller',
          'items.package',
          'items.service_address',
          'items.addons',
          'items.options',
          'items.reviews',
          'created_by',
        ],
        order: { [sort_by]: sort_order },
        skip,
        take: limit,
      });

      return {
        data: entities.map((entity) => SalesOrderMapper.toDomain(entity)),
        total,
        page,
        limit,
      };
    }
  }

  /**
   * Find all orders with pagination
   */
  async findAll(query: QuerySalesOrderDto): Promise<PaginatedSalesOrders> {
    const {
      page = 1,
      limit = 20,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status && status.length > 0) {
      whereClause.status = In(status);
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'user',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.seller',
        'items.variant.media',
        'items.variant.product.product_media_mappings',
        'items.variant.product.product_media_mappings.media',
        'created_by',
      ],
      order: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => SalesOrderMapper.toDomain(entity)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update sales order
   */
  async update(id: number, data: Partial<SalesOrder>): Promise<SalesOrder> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Sales order with ID ${id} not found`);
    }

    const updateData = SalesOrderMapper.toPersistence({
      ...data,
      id,
    });

    // Only update specific fields
    if (data.status !== undefined) existingEntity.status = updateData.status;
    if (data.notes !== undefined) existingEntity.notes = updateData.notes;
    if (data.review_id !== undefined) {
      existingEntity.review_id = updateData.review_id;
    }
    if (data.reviewed_at !== undefined) {
      existingEntity.reviewed_at = updateData.reviewed_at;
    }
    if (data.updated_by) existingEntity.updated_by = updateData.updated_by;

    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<SalesOrder>;
  }

  /**
   * Find sales order containing specific item that belongs to a user
   */
  async findSalesOrderItemByUser(
    userId: number,
    salesOrderItemId: number,
  ): Promise<SalesOrder | null> {
    const entity = await this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.seller', 'productSeller')
      .leftJoinAndSelect('item.service', 'service')
      .leftJoinAndSelect('service.seller', 'serviceSeller')
      .leftJoinAndSelect('item.package', 'package')
      .leftJoinAndSelect('item.service_address', 'serviceAddress')
      .leftJoinAndSelect('item.addons', 'addons')
      .leftJoinAndSelect('item.options', 'options')
      .leftJoinAndSelect('item.reviews', 'itemReviews')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.seller', 'seller')
      .where('order.user_id = :userId', { userId })
      .andWhere('item.id = :salesOrderItemId', { salesOrderItemId })
      .getOne();

    if (!entity) {
      return null;
    }

    return SalesOrderMapper.toDomain(entity);
  }
}
