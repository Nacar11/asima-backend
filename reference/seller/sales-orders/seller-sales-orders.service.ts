import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { User } from '@/users/domain/user';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import {
  CreateTrackingEventDto,
  SELLER_ALLOWED_EVENT_TYPES,
} from './dto/create-tracking-event.dto';
import { QuerySellerSalesOrderDto } from './dto/query-seller-sales-order.dto';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { SalesOrderVoucherMapper } from '@/sales-order-vouchers/persistence/mappers/sales-order-voucher.mapper';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserVoucherMapper } from '@/vouchers/persistence/mappers/user-voucher.mapper';
import { WalletsService } from '@/wallets/wallets.service';

export interface PaginatedOrders {
  data: SalesOrder[];
  totalCount: number;
  skip: number;
  take: number;
}

@Injectable()
export class SellerSalesOrdersService {
  constructor(
    @InjectRepository(SalesOrderEntity)
    private readonly orderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly orderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    private readonly inventoryStocksService: InventoryStocksService,
    private readonly orderTrackingService: OrderTrackingService,
    private readonly notificationsService: NotificationsService,
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    @InjectRepository(UserVoucherEntity)
    private readonly userVoucherRepository: Repository<UserVoucherEntity>,
    private readonly walletsService: WalletsService,
  ) {}

  private readonly logger = new Logger(SellerSalesOrdersService.name);

  /**
   * Validate that user has access (must be seller or superadmin)
   */
  private validateSellerAccess(user: User): void {
    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException(
        'Access denied. You must be a seller or superadmin.',
      );
    }
  }

  /**
   * Validate that user has access to a specific order
   */
  private validateOrderAccess(order: SalesOrderEntity, user: User): void {
    // Superadmins can access all orders
    if (user.system_admin) {
      return;
    }

    // Sellers can only access their own store orders
    if (!user.seller_id) {
      throw new ForbiddenException(
        'Access denied. You must be a seller or superadmin.',
      );
    }

    if (order.seller_id !== user.seller_id) {
      throw new ForbiddenException(
        'Access denied. This order belongs to a different store.',
      );
    }
  }

  /**
   * Ensure a seller wallet exists. Called on every status transition so wallets
   * are created lazily for sellers who registered before the wallet feature.
   */
  private async ensureSellerWallet(order: SalesOrderEntity): Promise<void> {
    if (!order.seller_id) return;
    const seller = await this.sellerRepository.findOne({
      where: { id: order.seller_id },
      select: ['user_id'],
    });
    if (seller?.user_id) {
      await this.walletsService.ensureSellerWallet(
        seller.user_id,
        order.seller_id,
      );
    }
  }

  /**
   * Find all orders with pagination and filters
   * Sellers see only their store orders, superadmins see all
   */
  async findAll(
    query: QuerySellerSalesOrderDto,
    sellerId?: number | null,
  ): Promise<PaginatedOrders> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortOrder = query.sortBy || 'DESC';
    const sortField = query.sortField || 'created_at';

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.seller', 'seller')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.media', 'variantMedia')
      .leftJoinAndSelect('variant.product', 'variantProduct')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('items.reviews', 'itemReviews')
      .where('order.deleted_at IS NULL');

    // Filter by seller_id (required for non-superadmin users)
    if (sellerId) {
      qb.andWhere('order.seller_id = :sellerId', { sellerId });
    }

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.date_from) {
      qb.andWhere('order.created_at >= :date_from', {
        date_from: query.date_from,
      });
    }

    if (query.date_to) {
      qb.andWhere('order.created_at <= :date_to', { date_to: query.date_to });
    }

    // Unified search across order_number and customer name (OR logic)
    if (query.search) {
      qb.andWhere(
        '(order.order_number ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.order_number) {
      qb.andWhere('order.order_number ILIKE :orderNumber', {
        orderNumber: `%${query.order_number}%`,
      });
    }

    if (query.customer_name) {
      // Search in both first_name and last_name (OR condition)
      qb.andWhere(
        '(user.first_name ILIKE :customerName OR user.last_name ILIKE :customerName)',
        { customerName: `%${query.customer_name}%` },
      );
    }

    // Amount range filters
    if (query.subtotal_min !== undefined) {
      qb.andWhere('order.subtotal >= :subtotalMin', {
        subtotalMin: query.subtotal_min,
      });
    }
    if (query.subtotal_max !== undefined) {
      qb.andWhere('order.subtotal <= :subtotalMax', {
        subtotalMax: query.subtotal_max,
      });
    }
    if (query.total_min !== undefined) {
      qb.andWhere('order.total_amount >= :totalMin', {
        totalMin: query.total_min,
      });
    }
    if (query.total_max !== undefined) {
      qb.andWhere('order.total_amount <= :totalMax', {
        totalMax: query.total_max,
      });
    }
    if (query.tax_min !== undefined) {
      qb.andWhere('order.tax_amount >= :taxMin', {
        taxMin: query.tax_min,
      });
    }
    if (query.tax_max !== undefined) {
      qb.andWhere('order.tax_amount <= :taxMax', {
        taxMax: query.tax_max,
      });
    }
    if (query.shipping_min !== undefined) {
      qb.andWhere('order.shipping_amount >= :shippingMin', {
        shippingMin: query.shipping_min,
      });
    }
    if (query.shipping_max !== undefined) {
      qb.andWhere('order.shipping_amount <= :shippingMax', {
        shippingMax: query.shipping_max,
      });
    }

    // Handle special sorting cases
    if (sortField === 'status') {
      // Status sorting with workflow priority order
      qb.addSelect(
        `CASE "order"."status"
          WHEN 'pending' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'processing' THEN 3
          WHEN 'ready_to_ship' THEN 4
          WHEN 'shipped' THEN 5
          WHEN 'out_for_delivery' THEN 6
          WHEN 'delivered' THEN 7
          WHEN 'completed' THEN 8
          WHEN 'return_requested' THEN 9
          WHEN 'returned' THEN 10
          WHEN 'refunded' THEN 11
          WHEN 'cancelled' THEN 12
          ELSE 99
        END`,
        'status_priority',
      );
      qb.orderBy('status_priority', sortOrder);
    } else if (sortField === 'user_name') {
      // Sort by user's full name (first_name + last_name)
      qb.orderBy('user.first_name', sortOrder);
      qb.addOrderBy('user.last_name', sortOrder);
    } else {
      qb.orderBy(`order.${sortField}`, sortOrder);
    }

    qb.skip(skip).take(take);

    if (
      sortField !== 'created_at' &&
      sortField !== 'status' &&
      sortField !== 'user_name'
    ) {
      qb.addOrderBy('order.created_at', 'DESC');
    }

    qb.addOrderBy('order.id', 'DESC');

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => {
        const order = this.mapToDomain(entity);
        if (entity.items && entity.items.length > 0) {
          order.subtotal = entity.items.reduce(
            (sum, item) => sum + Number(item.total_price),
            0,
          );
        }
        return order;
      }),
      totalCount,
      skip,
      take,
    };
  }

  /**
   * Find order by ID with full details including tracking events
   * Sellers can only view their store orders, superadmins can view all
   */
  async findById(id: number, user: User): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const entity = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'seller',
        'seller.pickup_address_entity',
        'items',
        'items.variant',
        'items.variant.media',
        'items.variant.product',
        'items.service',
      ],
    });

    if (!entity) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(entity, user);

    const order = this.mapToDomain(entity);

    this.logger.debug(`mapped seller: ${JSON.stringify(order.seller)}`);

    // Recalculate subtotal from items (pre-discount, before voucher deductions)
    if (entity.items && entity.items.length > 0) {
      order.subtotal = entity.items.reduce(
        (sum, item) => sum + Number(item.total_price),
        0,
      );
    }

    // Include tracking events in the response
    order.tracking_events =
      await this.orderTrackingService.getEventsByOrderId(id);

    // Include applied voucher in the response (single - backward compat)
    const voucherRecords = await this.salesOrderVoucherRepository.find({
      where: { sales_order_id: id },
    });

    order.voucher =
      voucherRecords.length > 0
        ? SalesOrderVoucherMapper.toDomain(voucherRecords[0])
        : null;

    // Include all sales_order_vouchers with user_voucher
    order.sales_order_vouchers = await Promise.all(
      voucherRecords.map(async (record) => {
        const domain = SalesOrderVoucherMapper.toDomain(record);

        const userVoucherEntity = await this.userVoucherRepository.findOne({
          where: {
            id: record.user_voucher_id,
          },
        });

        domain.user_voucher = userVoucherEntity
          ? UserVoucherMapper.toDomain(userVoucherEntity)
          : null;

        return domain;
      }),
    );

    return order;
  }

  /**
   * Internal findById without user validation (for after-update fetching)
   */
  private async findByIdInternal(id: number): Promise<SalesOrder> {
    const entity = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'seller',
        'items',
        'items.variant',
        'items.variant.media',
        'items.variant.product',
        'items.service',
      ],
    });

    if (!entity) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapToDomain(entity);
  }

  /**
   * Update order details (notes, shipping address, items)
   */
  async updateOrder(
    id: number,
    dto: UpdateOrderDto,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.variant',
        'items.variant.media',
        'items.variant.product',
        'items.service',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Update basic fields
    if (dto.notes !== undefined) {
      order.notes = dto.notes;
    }

    if (dto.shipping_address !== undefined) {
      order.shipping_address = dto.shipping_address;
    }

    if (dto.status_notes !== undefined) {
      order.status_notes = dto.status_notes || null;
    }

    order.updated_by = { id: user.id } as any;

    // Update items if provided
    if (dto.items && dto.items.length > 0) {
      let subtotal = 0;

      for (const itemUpdate of dto.items) {
        const orderItem = await this.orderItemRepository.findOne({
          where: { id: itemUpdate.id, order_id: id },
        });

        if (!orderItem) {
          throw new NotFoundException(
            `Order item with ID ${itemUpdate.id} not found`,
          );
        }

        if (itemUpdate.quantity !== undefined) {
          orderItem.quantity = itemUpdate.quantity;
        }

        if (itemUpdate.unit_price !== undefined) {
          orderItem.unit_price = itemUpdate.unit_price;
        }

        orderItem.total_price = orderItem.quantity * orderItem.unit_price;
        orderItem.updated_by = { id: user.id } as any;

        await this.orderItemRepository.save(orderItem);
        subtotal += orderItem.total_price;
      }

      // Recalculate order totals
      order.subtotal = subtotal;
      order.total_amount = subtotal + order.tax_amount + order.shipping_amount;
    }

    await this.orderRepository.save(order);

    return this.findByIdInternal(id);
  }

  /**
   * Ship order - mark as shipped with tracking info
   * Transition: READY_TO_SHIP -> SHIPPED
   * Stock is deducted at this point (item leaves warehouse)
   */
  async shipOrder(
    id: number,
    dto: ShipOrderDto,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.service'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Only ready_to_ship orders can be shipped
    if (order.status !== OrderStatusEnum.READY_TO_SHIP) {
      throw new BadRequestException(
        `Order cannot be shipped. Current status: ${order.status}. Order must be in READY_TO_SHIP status.`,
      );
    }

    // Validate payment before shipping (security check)
    await this.validatePaymentBeforeProcessing(order);

    await this.ensureSellerWallet(order);

    // Auto-fill for in-house delivery if not provided
    if (!dto.tracking_number) {
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      dto.tracking_number = `INH-${timestamp}-${random}`;
    }

    if (!dto.shipping_provider) {
      dto.shipping_provider = 'In-House Delivery';
    }

    // Fulfill reserved stock (deduct from inventory) - stock leaves warehouse at SHIP time
    // Only process product items (service items don't have inventory)
    for (const item of order.items) {
      if (
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined
      ) {
        await this.inventoryStocksService.fulfillStock(
          item.variant_id,
          item.quantity,
          user,
        );
      }
    }

    // Auto-generate tracking number if not provided (for in-house delivery)
    const trackingNumber =
      dto.tracking_number || this.generateTrackingNumber(order.order_number);
    const shippingProvider = dto.shipping_provider || 'In-House Delivery';

    order.status = OrderStatusEnum.SHIPPED;
    order.status_notes = dto.status_notes || null;
    order.tracking_number = trackingNumber;
    order.shipping_provider = shippingProvider;
    order.shipped_at = new Date();
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.SHIPPED,
      `Order shipped via ${shippingProvider}. Tracking: ${trackingNumber}`,
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      dto.status_notes, // notes
    );

    // Send shipped notification to customer (non-blocking)
    this.sendOrderShippedNotification(
      order,
      trackingNumber,
      shippingProvider,
    ).catch((error) => {
      this.logger.error('Failed to send order shipped notification:', error);
    });

    return this.findByIdInternal(id);
  }

  /**
   * Send notification when order is confirmed
   */
  private async sendOrderConfirmedNotification(
    order: SalesOrderEntity,
    user: User,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      const sellerName = user.seller_id
        ? (
            await this.sellerRepository.findOne({
              where: { id: user.seller_id },
            })
          )?.store_name || 'Seller'
        : 'Seller';

      await this.notificationsService.sendOrderConfirmed(
        order.user_id,
        order.id,
        order.order_number,
        sellerName,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when order is shipped
   */
  private async sendOrderShippedNotification(
    order: SalesOrderEntity,
    trackingNumber: string,
    shippingProvider: string,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      await this.notificationsService.sendOrderShipped(
        order.user_id,
        order.id,
        order.order_number,
        trackingNumber,
        shippingProvider,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Mark order as out for delivery
   * Transition: SHIPPED -> OUT_FOR_DELIVERY
   */
  async outForDelivery(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Only shipped orders can be marked as out for delivery
    if (order.status !== OrderStatusEnum.SHIPPED) {
      throw new BadRequestException(
        `Order cannot be marked as out for delivery. Current status: ${order.status}. Order must be in SHIPPED status.`,
      );
    }

    await this.ensureSellerWallet(order);

    order.status = OrderStatusEnum.OUT_FOR_DELIVERY;
    order.status_notes = statusNotes || null;
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.OUT_FOR_DELIVERY,
      'Order is out for delivery',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send out for delivery notification to customer (non-blocking)
    this.sendOrderOutForDeliveryNotification(order).catch((error) => {
      this.logger.error('Failed to send out for delivery notification:', error);
    });

    return this.findByIdInternal(id);
  }

  /**
   * Mark order as delivered
   * Transition: SHIPPED/OUT_FOR_DELIVERY -> DELIVERED
   * Note: Stock was already deducted at SHIP time, no stock changes here
   */
  async deliverOrder(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Only shipped or out_for_delivery orders can be delivered
    if (
      ![OrderStatusEnum.SHIPPED, OrderStatusEnum.OUT_FOR_DELIVERY].includes(
        order.status,
      )
    ) {
      throw new BadRequestException(
        `Order cannot be marked as delivered. Current status: ${order.status}. Order must be in SHIPPED or OUT_FOR_DELIVERY status.`,
      );
    }

    // Validate payment before marking as delivered (security check)
    // COD orders: Payment will be/was collected on delivery
    // Non-COD: Payment must have been completed before this point
    await this.validatePaymentBeforeProcessing(order);

    await this.ensureSellerWallet(order);

    order.status = OrderStatusEnum.DELIVERED;
    order.status_notes = statusNotes || null;
    order.delivered_at = new Date();
    order.updated_by = { id: user.id } as any;

    // No stock changes - stock was already deducted at SHIP time

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.DELIVERED,
      'Order has been delivered',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send delivered notification to customer (non-blocking)
    this.sendOrderDeliveredNotification(order).catch((error) => {
      this.logger.error('Failed to send order delivered notification:', error);
    });

    return this.findByIdInternal(id);
  }

  /**
   * Send notification when order is delivered
   */
  private async sendOrderDeliveredNotification(
    order: SalesOrderEntity,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      await this.notificationsService.sendOrderDelivered(
        order.user_id,
        order.id,
        order.order_number,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when order is being processed
   */
  private async sendOrderProcessingNotification(
    order: SalesOrderEntity,
    user: User,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      const sellerName = user.seller_id
        ? (
            await this.sellerRepository.findOne({
              where: { id: user.seller_id },
            })
          )?.store_name || 'Seller'
        : 'Seller';

      await this.notificationsService.sendOrderProcessing(
        order.user_id,
        order.id,
        order.order_number,
        sellerName,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when order is ready to ship
   */
  private async sendOrderReadyToShipNotification(
    order: SalesOrderEntity,
    user: User,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      const sellerName = user.seller_id
        ? (
            await this.sellerRepository.findOne({
              where: { id: user.seller_id },
            })
          )?.store_name || 'Seller'
        : 'Seller';

      await this.notificationsService.sendOrderReadyToShip(
        order.user_id,
        order.id,
        order.order_number,
        sellerName,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when order is out for delivery
   */
  private async sendOrderOutForDeliveryNotification(
    order: SalesOrderEntity,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      await this.notificationsService.sendOrderOutForDelivery(
        order.user_id,
        order.id,
        order.order_number,
        order.tracking_number ?? undefined,
        order.shipping_provider ?? undefined,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when order is cancelled by seller
   */
  private async sendOrderCancelledNotification(
    order: SalesOrderEntity,
    reason?: string,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      await this.notificationsService.sendOrderCancelled(
        order.user_id,
        order.id,
        order.order_number,
        reason,
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Send notification when refund is processed
   */
  private async sendRefundProcessedNotification(
    order: SalesOrderEntity,
  ): Promise<void> {
    const customer = await this.userRepository.findOne({
      where: { id: order.user_id },
    });

    if (customer) {
      // For order-level refund, we use order_number as return_number
      await this.notificationsService.sendRefundProcessed(
        order.user_id,
        order.id,
        order.order_number,
        Number(order.total_amount),
        true, // send email
        customer.email ?? undefined,
        `${customer.first_name} ${customer.last_name}`,
      );
    }
  }

  /**
   * Confirm order (pending -> confirmed)
   * Transition: PENDING -> CONFIRMED
   */
  async confirmOrder(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    if (order.status !== OrderStatusEnum.PENDING) {
      throw new BadRequestException(
        `Order cannot be confirmed. Current status: ${order.status}`,
      );
    }

    // Block confirmation for non-COD orders that haven't been paid.
    // Exception: qr_manual and unionbank orders require manual admin confirmation
    // so they stay AWAITING_PAYMENT until the seller/admin verifies the QR proof.
    const manualPaymentMethods = ['gcash', 'qr_manual', 'unionbank'];
    const isManualPayment = manualPaymentMethods.includes(
      order.payment_method ?? '',
    );
    const unpaidStatuses = ['awaiting_payment', 'failed', 'pending'];
    if (
      !isManualPayment &&
      order.payment_method &&
      order.payment_method !== 'cod' &&
      unpaidStatuses.includes(order.payment_status)
    ) {
      throw new BadRequestException(
        `Order cannot be confirmed — payment has not been received yet (payment_status: ${order.payment_status}). Non-COD orders are auto-confirmed when payment succeeds.`,
      );
    }

    await this.ensureSellerWallet(order);

    order.status = OrderStatusEnum.CONFIRMED;
    order.status_notes = statusNotes || null;
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.ORDER_CONFIRMED,
      'Order has been confirmed by seller',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send notification to customer
    await this.sendOrderConfirmedNotification(order, user);

    // COD: credit pending earning when seller confirms — cash will be collected on delivery.
    if (order.payment_method === 'cod' && order.seller_id) {
      try {
        const sellerEntity = await this.sellerRepository.findOne({
          where: { id: order.seller_id },
          select: ['id', 'commission_rate'],
        });
        const commissionRate = sellerEntity
          ? Number(sellerEntity.commission_rate ?? 0)
          : 0;
        await this.walletsService.creditPendingEarning(
          order.seller_id,
          order.id,
          Number(order.subtotal),
          commissionRate,
        );
      } catch (e) {
        this.logger.warn(
          `Failed to credit pending earning for COD order ${order.id}: ${(e as Error).message}`,
        );
      }
    }

    return this.findByIdInternal(id);
  }

  /**
   * Start processing order (confirmed -> processing)
   * Transition: CONFIRMED -> PROCESSING
   */
  async startProcessing(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    if (order.status !== OrderStatusEnum.CONFIRMED) {
      throw new BadRequestException(
        `Order cannot be processed. Current status: ${order.status}`,
      );
    }

    // Validate payment before processing (security check)
    await this.validatePaymentBeforeProcessing(order);

    await this.ensureSellerWallet(order);

    order.status = OrderStatusEnum.PROCESSING;
    order.status_notes = statusNotes || null;
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.PROCESSING,
      'Order is being processed',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send processing notification to customer (non-blocking)
    this.sendOrderProcessingNotification(order, user).catch((error) => {
      this.logger.error('Failed to send order processing notification:', error);
    });

    return this.findByIdInternal(id);
  }

  /**
   * Mark order as ready to ship (processing -> ready_to_ship)
   * Transition: PROCESSING -> READY_TO_SHIP
   */
  async readyToShip(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    if (order.fulfillment_type === 'pickup') {
      throw new BadRequestException(
        'Pickup orders cannot be marked as ready to ship. Use the pickup status endpoint instead.',
      );
    }

    if (order.status !== OrderStatusEnum.PROCESSING) {
      throw new BadRequestException(
        `Order cannot be marked as ready to ship. Current status: ${order.status}. Order must be in PROCESSING status.`,
      );
    }

    await this.ensureSellerWallet(order);

    order.status = OrderStatusEnum.READY_TO_SHIP;
    order.status_notes = statusNotes || null;
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.READY_TO_SHIP,
      'Order is packed and ready to ship',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send ready to ship notification to customer (non-blocking)
    this.sendOrderReadyToShipNotification(order, user).catch((error) => {
      this.logger.error(
        'Failed to send order ready to ship notification:',
        error,
      );
    });

    return this.findByIdInternal(id);
  }

  /**
   * Soft delete order
   */
  async deleteOrder(id: number, user: User): Promise<void> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.service'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Release stock if order has reserved stock (pending/confirmed status)
    // Only process product items (service items don't have inventory)
    if (
      [OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED].includes(
        order.status,
      )
    ) {
      for (const item of order.items) {
        if (
          item.item_type === CartItemTypeEnum.PRODUCT &&
          item.variant_id !== null &&
          item.variant_id !== undefined
        ) {
          await this.inventoryStocksService.releaseStock(
            item.variant_id,
            item.quantity,
            user,
          );
        }
      }
    }

    order.deleted_at = new Date();
    order.deleted_by = { id: user.id } as any;

    await this.orderRepository.save(order);
  }

  /**
   * Refund order (returned -> refunded)
   * Transition: RETURNED -> REFUNDED
   */
  async refundOrder(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Only returned orders can be refunded
    if (order.status !== OrderStatusEnum.RETURNED) {
      throw new BadRequestException(
        `Order cannot be refunded. Current status: ${order.status}. Order must be in RETURNED status.`,
      );
    }

    order.status = OrderStatusEnum.REFUNDED;
    order.status_notes = statusNotes || null;
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.REFUND_PROCESSED,
      'Refund has been processed',
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send refund processed notification to customer (non-blocking)
    this.sendRefundProcessedNotification(order).catch((error) => {
      this.logger.error('Failed to send refund processed notification:', error);
    });

    // Send refund confirmation notification to seller (non-blocking)
    // This confirms that their refund processing action succeeded
    return this.findByIdInternal(id);
  }

  /**
   * Cancel order with reason
   * Transition: PENDING/CONFIRMED/PROCESSING/READY_TO_SHIP -> CANCELLED
   */
  async cancelOrder(
    id: number,
    reason: string,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.service'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Orders can be cancelled before shipping
    const cancellableStatuses = [
      OrderStatusEnum.PENDING,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.PROCESSING,
      OrderStatusEnum.READY_TO_SHIP,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled. Current status: ${order.status}. Please use return flow for shipped orders.`,
      );
    }

    // Release reserved stock
    // Only process product items (service items don't have inventory)
    for (const item of order.items) {
      if (
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined
      ) {
        await this.inventoryStocksService.releaseStock(
          item.variant_id,
          item.quantity,
          user,
        );
      }
    }

    // Determine who is cancelling
    const cancelledBy = user.system_admin ? 'admin' : 'seller';
    const trackingMessage = reason
      ? `Order cancelled by ${cancelledBy}. Reason: ${reason}`
      : `Order cancelled by ${cancelledBy}`;

    order.status = OrderStatusEnum.CANCELLED;
    order.status_notes = statusNotes || null;
    order.cancellation_reason = reason || null;
    order.cancelled_at = new Date();
    order.updated_by = { id: user.id } as any;

    await this.orderRepository.save(order);

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.CANCELLED,
      trackingMessage,
      user,
      undefined, // location
      undefined, // latitude
      undefined, // longitude
      statusNotes, // notes
    );

    // Send cancellation notification to customer (non-blocking)
    this.sendOrderCancelledNotification(order, reason).catch((error) => {
      this.logger.error('Failed to send order cancelled notification:', error);
    });

    return this.findByIdInternal(id);
  }

  /**
   * Get tracking events for an order
   */
  async getOrderTracking(
    id: number,
    user: User,
  ): Promise<OrderTrackingEvent[]> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    return this.orderTrackingService.getEventsByOrderId(id);
  }

  /**
   * Add manual tracking event (for delivery updates, exceptions)
   */
  async addTrackingEvent(
    id: number,
    dto: CreateTrackingEventDto,
    user: User,
  ): Promise<OrderTrackingEvent> {
    this.validateSellerAccess(user);

    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.validateOrderAccess(order, user);

    // Validate event type is allowed for manual entry
    if (
      !SELLER_ALLOWED_EVENT_TYPES.includes(
        dto.event_type as (typeof SELLER_ALLOWED_EVENT_TYPES)[number],
      )
    ) {
      throw new BadRequestException(
        `Event type '${dto.event_type}' is not allowed for manual entry. Allowed types: ${SELLER_ALLOWED_EVENT_TYPES.join(', ')}`,
      );
    }

    // Create the tracking event
    return this.orderTrackingService.createEvent(
      id,
      dto.event_type,
      dto.description,
      user,
      dto.location,
      dto.latitude,
      dto.longitude,
      dto.notes,
    );
  }

  /**
   * Get seller ID for user (public method for return requests)
   * Returns seller_id if user is a seller, throws if user is not authorized
   */
  getSellerIdForUser(user: User): number {
    this.validateSellerAccess(user);

    if (user.seller_id) {
      return user.seller_id;
    }

    // Superadmins don't have a seller_id but should still be able to manage returns
    // For superadmins, we'll throw a different error indicating they need to specify seller context
    if (user.system_admin) {
      throw new BadRequestException(
        'Superadmins must use seller-specific context for return management',
      );
    }

    throw new ForbiddenException('You must be a seller to manage returns');
  }

  /**
   * Generate tracking number for in-house delivery
   * Format: EK-{orderNumber suffix}-{timestamp}
   * Example: EK-M5K8P2Q3-1704067200
   */
  private generateTrackingNumber(orderNumber: string): string {
    // Extract the unique part from order number (after ORD-)
    const orderSuffix = orderNumber.replace('ORD-', '');
    const timestamp = Math.floor(Date.now() / 1000);
    return `EK-${orderSuffix}-${timestamp}`;
  }

  /**
   * Map entity to domain model
   */
  private mapToDomain(entity: SalesOrderEntity): SalesOrder {
    return {
      id: entity.id,
      user_id: entity.user_id,
      seller_id: entity.seller_id,
      seller: entity.seller
        ? {
            id: entity.seller.id,
            store_name: entity.seller.store_name,
            pickup_address:
              entity.seller.pickup_address ??
              (entity.seller.pickup_address_entity
                ? [
                    entity.seller.pickup_address_entity.address_line1,
                    entity.seller.pickup_address_entity.city,
                    entity.seller.pickup_address_entity.state_province,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : null),
            phone: entity.seller.contact ?? null,
          }
        : undefined,
      user: entity.user
        ? {
            id: entity.user.id,
            first_name: entity.user.first_name || '',
            last_name: entity.user.last_name || '',
            email: entity.user.email,
          }
        : undefined,
      order_number: entity.order_number,
      status: entity.status,
      status_notes: entity.status_notes,
      subtotal: Number(entity.subtotal),
      tax_amount: Number(entity.tax_amount),
      shipping_amount: Number(entity.shipping_amount),
      total_amount: Number(entity.total_amount),
      commission_rate: Number(entity.commission_rate ?? 0),
      notes: entity.notes || undefined,
      shipping_address: entity.shipping_address,
      // Shipping address snapshot fields
      user_address_id: entity.user_address_id,
      shipping_recipient_name: entity.shipping_recipient_name,
      shipping_phone: entity.shipping_phone,
      shipping_address_line1: entity.shipping_address_line1,
      shipping_address_line2: entity.shipping_address_line2,
      shipping_city: entity.shipping_city,
      shipping_state_province: entity.shipping_state_province,
      shipping_postal_code: entity.shipping_postal_code,
      shipping_country: entity.shipping_country,
      shipping_method: entity.shipping_method,
      // Tracking fields
      tracking_number: entity.tracking_number,
      shipping_provider: entity.shipping_provider,
      shipped_at: entity.shipped_at,
      delivered_at: entity.delivered_at,
      completed_at: entity.completed_at,
      review_id: entity.review_id,
      reviewed_at: entity.reviewed_at,
      cancellation_reason: entity.cancellation_reason,
      cancelled_at: entity.cancelled_at,
      payment_method: entity.payment_method,
      payment_status: entity.payment_status,
      items: entity.items?.map((item) => ({
        id: item.id,
        order_id: item.order_id,
        item_type: item.item_type,
        variant_id: item.variant_id,
        variant: item.variant
          ? {
              id: item.variant.id,
              variant_name: item.variant.variant_name,
              sku: item.variant.sku,
              media: item.variant.media
                ? MediaMapper.toDomain(item.variant.media)
                : null,
              url: item.variant.media
                ? (MediaMapper.toDomain(item.variant.media).url ?? null)
                : null,
              product: item.variant.product
                ? {
                    id: item.variant.product.id,
                    product_name: item.variant.product.product_name,
                  }
                : undefined,
            }
          : undefined,
        service_id: item.service_id,
        service: item.service
          ? {
              id: item.service.id,
              title: item.service.title,
              short_description: item.service.short_description,
            }
          : undefined,
        package_id: item.package_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        review_id: item.reviews?.length ? item.reviews[0].id : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      // Pickup Fulfillment
      fulfillment_type: entity.fulfillment_type ?? 'delivery',
      pickup_date: entity.pickup_date ?? null,
      pickup_time: entity.pickup_time ? String(entity.pickup_time) : null,
      pickup_notes: entity.pickup_notes ?? null,
      ready_for_pickup_at: entity.ready_for_pickup_at ?? null,
      picked_up_at: entity.picked_up_at ?? null,
      pickup_reminder_notified_at: entity.pickup_reminder_notified_at ?? null,
      noshow_warning_1_notified_at: entity.noshow_warning_1_notified_at ?? null,
      noshow_warning_2_notified_at: entity.noshow_warning_2_notified_at ?? null,
      grace_period_extension: entity.grace_period_extension ?? null,

      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
    };
  }

  /**
   * Validate payment was received before processing/shipping/delivering order
   * Prevents unpaid orders from progressing through fulfillment
   */
  private async validatePaymentBeforeProcessing(
    order: SalesOrderEntity,
  ): Promise<void> {
    const isCod = order.payment_method === 'cod';

    // COD orders can proceed (payment will be collected on delivery)
    if (isCod) {
      return;
    }

    // Non-COD orders must have completed payment
    const payments =
      await this.checkoutPaymentsService.findPaymentsBySalesOrderId(order.id);

    const completedPayment = payments.find((p) =>
      [
        CheckoutPaymentStatusEnum.COMPLETED,
        CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
      ].includes(p.status as CheckoutPaymentStatusEnum),
    );

    if (!completedPayment) {
      const latestPayment = payments[0];
      throw new BadRequestException(
        `Cannot process order. Payment has not been completed. ` +
          `Order #${order.order_number} (payment_method: ${order.payment_method}) requires completed payment before processing. ` +
          `Current payment status: ${latestPayment?.status ?? 'not found'}`,
      );
    }
  }
}
