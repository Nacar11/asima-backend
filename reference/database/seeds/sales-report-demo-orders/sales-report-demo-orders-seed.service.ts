import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { ISeedService } from '../seed.interface';

interface DemoOrderItemInput {
  readonly variant: ProductVariantEntity;
  readonly quantity: number;
  readonly unitPrice: number;
}

interface PendingOrderItem {
  readonly orderNumber: string;
  readonly createdAt: Date;
  readonly variantId: number;
  readonly quantity: number;
  readonly unitPrice: number;
}

@Injectable()
export class SalesReportDemoOrdersSeedService implements ISeedService {
  private static readonly SellerEmail = 'john.doe@cody.inc';
  private static readonly BuyerIds = [3, 4] as const;
  private static readonly StoreName = 'Fashion Boutique';
  private static readonly OrderNumberPrefix = 'SRDEMO-JD-2025-';
  private static readonly OrdersToCreate = 30;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemRepository: Repository<SalesOrderItemEntity>,
  ) {}

  async run(): Promise<void> {
    const sellerUser = await this.userRepository.findOne({
      where: { email: SalesReportDemoOrdersSeedService.SellerEmail },
    });

    if (!sellerUser) {
      console.warn(
        `⚠️  Missing ${SalesReportDemoOrdersSeedService.SellerEmail}. Skipping sales report demo orders seed.`,
      );
      return;
    }

    const seller = await this.sellerRepository.findOne({
      where: { user_id: sellerUser.id },
    });

    if (!seller) {
      console.warn(
        `⚠️  Missing seller record for ${SalesReportDemoOrdersSeedService.SellerEmail}. Skipping sales report demo orders seed.`,
      );
      return;
    }

    await this.ensureSellerStoreName({ seller, causer: sellerUser });

    const buyers = await this.userRepository.findByIds([
      ...SalesReportDemoOrdersSeedService.BuyerIds,
    ]);

    if (buyers.length === 0) {
      console.warn(
        '⚠️  Missing buyer users (expected user_id 3 and 4). Skipping sales report demo orders seed.',
      );
      return;
    }

    const existingDemoOrdersCount = await this.salesOrderRepository
      .createQueryBuilder('so')
      .where('so.order_number LIKE :prefix', {
        prefix: `${SalesReportDemoOrdersSeedService.OrderNumberPrefix}%`,
      })
      .getCount();

    const variants = await this.getSellerVariants(seller.id);

    if (variants.length === 0) {
      console.warn(
        `⚠️  No active product variants found for seller_id ${seller.id}. Skipping sales report demo orders seed.`,
      );
      return;
    }

    const demoOrders =
      existingDemoOrdersCount > 0
        ? await this.getExistingDemoOrders()
        : await this.createDemoOrders({
            buyers,
            sellerId: seller.id,
            causer: sellerUser,
          });

    await this.ensureDemoOrderItems({
      orders: demoOrders,
      variants,
      causer: sellerUser,
    });

    console.log(
      `✅ Sales report demo orders ensured (${demoOrders.length} orders) for ${SalesReportDemoOrdersSeedService.SellerEmail}`,
    );
  }

  private async getExistingDemoOrders(): Promise<SalesOrderEntity[]> {
    return this.salesOrderRepository
      .createQueryBuilder('so')
      .where('so.order_number LIKE :prefix', {
        prefix: `${SalesReportDemoOrdersSeedService.OrderNumberPrefix}%`,
      })
      .orderBy('so.order_number', 'ASC')
      .getMany();
  }

  private async createDemoOrders(params: {
    readonly buyers: UserEntity[];
    readonly sellerId: number;
    readonly causer: UserEntity;
  }): Promise<SalesOrderEntity[]> {
    const orderEntities: SalesOrderEntity[] = [];
    const orderDatesByOrderNumber = new Map<string, Date>();

    for (let i = 0; i < SalesReportDemoOrdersSeedService.OrdersToCreate; i++) {
      const buyer = params.buyers[i % params.buyers.length];
      const createdAt = this.getOrderDateForIndex(i);

      const orderNumber = `${SalesReportDemoOrdersSeedService.OrderNumberPrefix}${String(
        i + 1,
      ).padStart(4, '0')}`;

      orderDatesByOrderNumber.set(orderNumber, createdAt);

      orderEntities.push(
        this.salesOrderRepository.create({
          user_id: buyer.id,
          seller_id: params.sellerId,
          order_number: orderNumber,
          status: OrderStatusEnum.COMPLETED,
          subtotal: 0,
          tax_amount: 0,
          shipping_amount: 0,
          total_amount: 0,
          notes: 'Seeded sales report demo order',
          status_notes: 'COMPLETED (seeded for sales report testing)',
          created_by: params.causer,
          updated_by: params.causer,
        }),
      );
    }

    const savedOrders = await this.salesOrderRepository.save(orderEntities);

    await Promise.all(
      savedOrders.map(async (savedOrder: SalesOrderEntity): Promise<void> => {
        const orderDate = orderDatesByOrderNumber.get(savedOrder.order_number);
        if (!orderDate) {
          return;
        }
        await this.salesOrderRepository.update(
          { id: savedOrder.id },
          {
            created_at: orderDate,
            updated_at: orderDate,
            shipped_at: orderDate,
            delivered_at: orderDate,
            completed_at: orderDate,
          },
        );
      }),
    );

    return this.getExistingDemoOrders();
  }

  private async ensureDemoOrderItems(params: {
    readonly orders: SalesOrderEntity[];
    readonly variants: ProductVariantEntity[];
    readonly causer: UserEntity;
  }): Promise<void> {
    const orderIds = params.orders.map((order) => order.id);
    if (orderIds.length === 0) {
      return;
    }

    await this.salesOrderItemRepository.delete({
      order_id: In(orderIds),
    });

    const pendingOrderItems: PendingOrderItem[] = [];

    for (let i = 0; i < params.orders.length; i++) {
      const order = params.orders[i];
      const items = this.getItemsForOrder({
        variants: params.variants,
        orderIndex: i,
      });

      for (const item of items) {
        pendingOrderItems.push({
          orderNumber: order.order_number,
          createdAt: order.created_at,
          variantId: item.variant.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
    }

    const orderIdByOrderNumber = new Map<string, number>();
    for (const order of params.orders) {
      orderIdByOrderNumber.set(order.order_number, order.id);
    }

    const orderItemEntities: SalesOrderItemEntity[] = pendingOrderItems
      .map((pendingItem) => {
        const orderId = orderIdByOrderNumber.get(pendingItem.orderNumber);
        if (!orderId) {
          return null;
        }
        return this.salesOrderItemRepository.create({
          order_id: orderId,
          variant_id: pendingItem.variantId,
          quantity: pendingItem.quantity,
          unit_price: pendingItem.unitPrice,
          total_price: pendingItem.unitPrice * pendingItem.quantity,
          created_by: params.causer,
          updated_by: params.causer,
          created_at: pendingItem.createdAt,
          updated_at: pendingItem.createdAt,
        });
      })
      .filter((item): item is SalesOrderItemEntity => item !== null);

    await this.salesOrderItemRepository.save(orderItemEntities);

    const subtotalByOrderId = new Map<number, number>();
    for (const item of orderItemEntities) {
      const subtotal = subtotalByOrderId.get(item.order_id) ?? 0;
      subtotalByOrderId.set(item.order_id, subtotal + Number(item.total_price));
    }

    await Promise.all(
      params.orders.map(async (order): Promise<void> => {
        const subtotal = subtotalByOrderId.get(order.id) ?? 0;
        await this.salesOrderRepository.update(
          { id: order.id },
          {
            subtotal,
            tax_amount: 0,
            shipping_amount: 0,
            total_amount: subtotal,
            updated_at: order.created_at,
          },
        );
      }),
    );
  }

  private async ensureSellerStoreName(params: {
    readonly seller: SellerEntity;
    readonly causer: UserEntity;
  }): Promise<void> {
    if (
      params.seller.store_name === SalesReportDemoOrdersSeedService.StoreName
    ) {
      return;
    }

    await this.sellerRepository.save({
      ...params.seller,
      store_name: SalesReportDemoOrdersSeedService.StoreName,
      slug: SalesReportDemoOrdersSeedService.StoreName.toLowerCase().replace(
        /\s+/g,
        '-',
      ),
      updated_by: params.causer,
    });
  }

  private async getSellerVariants(
    sellerId: number,
  ): Promise<ProductVariantEntity[]> {
    return this.productVariantRepository
      .createQueryBuilder('pv')
      .innerJoin('pv.product', 'p')
      .where('p.seller_id = :sellerId', { sellerId })
      .andWhere('pv.status = :status', { status: 'Active' })
      .getMany();
  }

  private getOrderDateForIndex(orderIndex: number): Date {
    const monthIndex = orderIndex % 12; // 0..11
    const day = (orderIndex % 25) + 1; // 1..26
    const hour = (orderIndex % 10) + 8; // 8..17
    return new Date(Date.UTC(2025, monthIndex, day, hour, 0, 0));
  }

  private getItemsForOrder(params: {
    readonly variants: ProductVariantEntity[];
    readonly orderIndex: number;
  }): DemoOrderItemInput[] {
    const itemsCount = this.getItemsCountForOrder(params.orderIndex);
    const items: DemoOrderItemInput[] = [];

    const variantIndexes = this.getVariantIndexesForOrder({
      orderIndex: params.orderIndex,
      variantsCount: params.variants.length,
      itemsCount,
    });
    for (let i = 0; i < variantIndexes.length; i++) {
      const variant = params.variants[variantIndexes[i]];
      const quantity = this.getQuantityForOrderItem({
        orderIndex: params.orderIndex,
        itemIndex: i,
      });
      const unitPrice = Number(variant.selling_price) || 100;
      items.push({ variant, quantity, unitPrice });
    }
    return items;
  }

  private getItemsCountForOrder(orderIndex: number): number {
    const roll = (orderIndex * 9301 + 49297) % 233280;
    const normalized = roll / 233280;
    if (normalized < 0.1) {
      return 6;
    }
    if (normalized < 0.25) {
      return 5;
    }
    return (orderIndex % 4) + 1;
  }

  private getVariantIndexesForOrder(params: {
    readonly orderIndex: number;
    readonly variantsCount: number;
    readonly itemsCount: number;
  }): number[] {
    const indexes: number[] = [];
    const step =
      (params.orderIndex % Math.max(2, params.variantsCount - 1)) + 1;
    let cursor = params.orderIndex % params.variantsCount;
    for (let i = 0; i < params.itemsCount; i++) {
      indexes.push(cursor);
      cursor = (cursor + step + i) % params.variantsCount;
    }
    return Array.from(new Set(indexes));
  }

  private getQuantityForOrderItem(params: {
    readonly orderIndex: number;
    readonly itemIndex: number;
  }): number {
    const roll = (params.orderIndex + 1) * (params.itemIndex + 3);
    return (roll % 3) + 1;
  }
}
