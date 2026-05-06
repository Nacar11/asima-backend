import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { QuerySalesOrderDto } from '@/sales-orders/dto/query-sales-order.dto';

/**
 * Paginated result type for sales orders
 */
export interface PaginatedSalesOrders {
  data: SalesOrder[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Abstract base repository for Sales Order entities
 * Defines the contract for sales order data access operations
 */
export abstract class BaseSalesOrderRepository {
  /**
   * Create a new sales order
   * @param data Sales order domain object
   * @returns Created sales order
   */
  abstract create(data: SalesOrder): Promise<SalesOrder>;

  /**
   * Find sales order by ID
   * @param id Order ID
   * @returns Sales order or null if not found
   */
  abstract findById(id: number): Promise<SalesOrder | null>;

  /**
   * Find sales order by order number
   * @param orderNumber Unique order number
   * @returns Sales order or null if not found
   */
  abstract findByOrderNumber(orderNumber: string): Promise<SalesOrder | null>;

  /**
   * Find sales order by idempotency key and user ID
   * @param idempotencyKey Idempotency key
   * @param userId User ID
   * @returns Sales order or null if not found
   */
  abstract findByIdempotencyKey(
    idempotencyKey: string,
    userId: number,
  ): Promise<SalesOrder | null>;

  /**
   * Find all orders for a user with pagination
   * @param userId User ID
   * @param query Query parameters
   * @returns Paginated sales orders
   */
  abstract findByUserId(
    userId: number,
    query: QuerySalesOrderDto,
  ): Promise<PaginatedSalesOrders>;

  /**
   * Find all orders with pagination
   * @param query Query parameters
   * @returns Paginated sales orders
   */
  abstract findAll(query: QuerySalesOrderDto): Promise<PaginatedSalesOrders>;

  /**
   * Update sales order
   * @param id Order ID
   * @param data Partial sales order domain object
   * @returns Updated sales order
   */
  abstract update(id: number, data: Partial<SalesOrder>): Promise<SalesOrder>;

  /**
   * Find sales order containing specific item that belongs to a user
   * @param userId User ID
   * @param salesOrderItemId Sales order item ID
   * @returns Sales order or null if not found
   */
  abstract findSalesOrderItemByUser(
    userId: number,
    salesOrderItemId: number,
  ): Promise<SalesOrder | null>;
}
