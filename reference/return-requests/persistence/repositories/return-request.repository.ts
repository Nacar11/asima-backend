import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, ILike, Repository } from 'typeorm';
import { ReturnRequestEntity } from '../entities/return-request.entity';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import { ReturnRequestMapper } from '../mappers/return-request.mapper';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';
import { QueryReturnRequestDevExtremeDto } from '@/return-requests/dto/query-return-request-devextreme.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

export interface PaginatedReturnRequests {
  data: ReturnRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryReturnRequestOptions {
  page?: number;
  limit?: number;
  status?: ReturnRequestStatusEnum | ReturnRequestStatusEnum[];
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

@Injectable()
export class ReturnRequestRepository {
  constructor(
    @InjectRepository(ReturnRequestEntity)
    private readonly repository: Repository<ReturnRequestEntity>,
  ) {}

  private readonly defaultRelations = [
    'order',
    'user',
    'seller',
    'items',
    'items.variant',
    'items.variant.product',
    'items.variant.product.product_media_mappings',
    'items.variant.product.product_media_mappings.media',
    'items.sales_order_item',
    'media_mappings',
    'media_mappings.media',
    'created_by',
    'updated_by',
  ];

  // Optimized relations for list views - only load what's displayed
  private readonly listRelations = [
    'order', // For order_number
    'user', // For customer name
    // Skip: seller, items, media_mappings, created_by, updated_by
  ];

  async create(data: Partial<ReturnRequest>): Promise<ReturnRequest> {
    const persistenceEntity = ReturnRequestMapper.toPersistence(data);
    const savedEntity = await this.repository.save(
      persistenceEntity as ReturnRequestEntity,
    );
    return this.findById(savedEntity.id) as Promise<ReturnRequest>;
  }

  async findById(id: number): Promise<ReturnRequest | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: this.defaultRelations,
    });

    if (!entity) {
      return null;
    }

    return ReturnRequestMapper.toDomain(entity);
  }

  async findByOrderId(orderId: number): Promise<ReturnRequest | null> {
    const entity = await this.repository.findOne({
      where: { order_id: orderId, deleted_at: IsNull() },
      relations: this.defaultRelations,
    });

    if (!entity) {
      return null;
    }

    return ReturnRequestMapper.toDomain(entity);
  }

  async findActiveByOrderId(orderId: number): Promise<ReturnRequest | null> {
    const entity = await this.repository.findOne({
      where: {
        order_id: orderId,
        deleted_at: IsNull(),
        status: In([
          ReturnRequestStatusEnum.PENDING,
          ReturnRequestStatusEnum.APPROVED,
          ReturnRequestStatusEnum.PICKUP_SCHEDULED,
          ReturnRequestStatusEnum.PICKED_UP,
          ReturnRequestStatusEnum.RECEIVED,
        ]),
      },
      relations: this.defaultRelations,
    });

    if (!entity) {
      return null;
    }

    return ReturnRequestMapper.toDomain(entity);
  }

  async findByReturnNumber(
    returnNumber: string,
  ): Promise<ReturnRequest | null> {
    const entity = await this.repository.findOne({
      where: { return_number: returnNumber },
      relations: this.defaultRelations,
    });

    if (!entity) {
      return null;
    }

    return ReturnRequestMapper.toDomain(entity);
  }

  async findBySellerId(
    sellerId: number,
    options: QueryReturnRequestOptions,
  ): Promise<PaginatedReturnRequests> {
    const {
      page = 1,
      limit = 20,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = { seller_id: sellerId, deleted_at: IsNull() };
    if (status) {
      whereClause.status = Array.isArray(status) ? In(status) : status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: this.defaultRelations,
      order: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => ReturnRequestMapper.toDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async findByUserId(
    userId: number,
    options: QueryReturnRequestOptions,
  ): Promise<PaginatedReturnRequests> {
    const {
      page = 1,
      limit = 20,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = { user_id: userId, deleted_at: IsNull() };
    if (status) {
      whereClause.status = Array.isArray(status) ? In(status) : status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: this.defaultRelations,
      order: { [sort_by]: sort_order },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => ReturnRequestMapper.toDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async update(
    id: number,
    data: Partial<ReturnRequest>,
  ): Promise<ReturnRequest> {
    await this.repository.update(id, ReturnRequestMapper.toPersistence(data));
    return this.findById(id) as Promise<ReturnRequest>;
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    await this.repository.update(id, {
      deleted_at: new Date(),
      deleted_by: { id: deletedBy } as any,
    });
  }

  /**
   * Find return requests by seller ID with DevExtreme query support
   */
  async findBySellerIdDevExtreme(
    sellerId: number | null,
    query: QueryReturnRequestDevExtremeDto,
  ): Promise<DevExtremePaginatedResponseDto<ReturnRequest>> {
    const {
      skip = 0,
      take = 20,
      sort,
      filter,
      status,
      searchValue,
      searchExpr,
    } = query;

    // Build where clause — admins (sellerId=null) see all, sellers see only theirs
    const whereClause: any = { deleted_at: IsNull() };
    if (sellerId) {
      whereClause.seller_id = sellerId;
    }

    // Apply status filter
    if (status) {
      whereClause.status = status;
    }

    // Apply DevExtreme filter
    if (filter && Array.isArray(filter) && filter.length > 0) {
      this.applyDevExtremeFilter(whereClause, filter);
    }

    // Apply search
    if (searchValue && searchExpr) {
      const allowedSearchFields = ['reason', 'return_number'];
      if (allowedSearchFields.includes(searchExpr)) {
        whereClause[searchExpr] = ILike(`%${searchValue}%`);
      }
    }

    // Build order clause
    const orderClause: any = {};
    if (sort && Array.isArray(sort) && sort.length > 0) {
      for (const sortItem of sort) {
        if (sortItem.selector) {
          orderClause[sortItem.selector] = sortItem.desc ? 'DESC' : 'ASC';
        }
      }
    } else {
      orderClause.created_at = 'DESC';
    }

    const [entities, totalCount] = await this.repository.findAndCount({
      where: whereClause,
      relations: this.listRelations, // Use optimized relations for list view
      order: orderClause,
      skip,
      take,
    });

    return {
      data: entities.map((entity) => ReturnRequestMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Apply DevExtreme filter array to where clause
   */
  private applyDevExtremeFilter(whereClause: any, filterArray: any[]): void {
    const allowedFilterFields = [
      'status',
      'reason',
      'return_number',
      'order_id',
    ];

    for (const element of filterArray) {
      if (Array.isArray(element) && element.length >= 3) {
        const [field, operator, value] = element;

        if (!allowedFilterFields.includes(field)) {
          continue; // Skip non-whitelisted fields
        }

        switch (operator.toLowerCase()) {
          case 'contains':
            whereClause[field] = ILike(`%${value}%`);
            break;
          case '=':
            whereClause[field] = value;
            break;
          case 'startswith':
            whereClause[field] = ILike(`${value}%`);
            break;
          case 'endswith':
            whereClause[field] = ILike(`%${value}`);
            break;
        }
      }
    }
  }
}
