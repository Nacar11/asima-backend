import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

@Injectable()
export class SalesOrdersSeedService {
  constructor(
    @InjectRepository(SalesOrderEntity)
    private salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const salesOrderCount = await this.salesOrderRepository.count();

    if (!salesOrderCount) {
      // Get seller (user_id 1) and buyers (user_id 2,3,4,5)
      const seller = await this.userRepository.findOne({ where: { id: 1 } });
      const buyers = await this.userRepository.findByIds([2, 3, 4, 5]);

      if (!seller || buyers.length === 0) {
        console.error('❌ Required users not found. Cannot seed sales orders.');
        return;
      }

      // Get all product variants
      const variants = await this.productVariantRepository.find({
        where: { status: 'Active' },
      });

      if (variants.length === 0) {
        console.error(
          '❌ No product variants found. Cannot seed sales orders.',
        );
        return;
      }

      // Create sales orders for each buyer
      const salesOrders: Partial<SalesOrderEntity>[] = [];
      const salesOrderItems: Partial<SalesOrderItemEntity>[] = [];

      // Generate order numbers
      let orderCounter = 1001;

      for (const buyer of buyers) {
        // Create 2-3 orders per buyer
        const ordersPerBuyer = Math.floor(Math.random() * 2) + 2;

        for (let i = 0; i < ordersPerBuyer; i++) {
          // Select random variants for this order (1-4 items per order)
          const itemsPerOrder = Math.floor(Math.random() * 4) + 1;
          const selectedVariants = this.getRandomVariants(
            variants,
            itemsPerOrder,
          );

          // Calculate order totals
          let subtotal = 0;
          const orderItems: Partial<SalesOrderItemEntity>[] = [];

          for (const variant of selectedVariants) {
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity per item
            const unitPrice = variant.selling_price;
            const totalPrice = unitPrice * quantity;

            subtotal += totalPrice;

            orderItems.push({
              variant_id: variant.id,
              quantity,
              unit_price: unitPrice,
              total_price: totalPrice,
              created_by: seller,
              updated_by: seller,
            });
          }

          const taxAmount = subtotal * 0.1; // 10% tax
          const shippingAmount = subtotal > 100 ? 0 : 15; // Free shipping over $100
          const totalAmount = subtotal + taxAmount + shippingAmount;

          // Create sales order
          const salesOrder: Partial<SalesOrderEntity> = {
            user_id: buyer.id,
            seller_id: seller.id,
            order_number: `SO-${orderCounter++}`,
            status: this.getRandomOrderStatus(),
            subtotal,
            tax_amount: taxAmount,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            notes: 'Please deliver before 5pm',
            status_notes: 'Order created during seeding process',
            shipping_address: `${buyer.first_name} ${buyer.last_name}'s Address, City, State 12345`,
            created_by: seller,
            updated_by: seller,
          };

          salesOrders.push(salesOrder);

          // Add order items (will be linked after order is saved)
          orderItems.forEach((item) => {
            salesOrderItems.push({
              ...item,
              order_id: 0, // Will be set after order is saved
            });
          });
        }
      }

      // Save sales orders first to get IDs
      const savedOrders = await this.salesOrderRepository.save(salesOrders);

      // Link order items to orders and save
      let itemIndex = 0;
      for (const order of savedOrders) {
        // Calculate how many items belong to this order
        const itemsForOrder = this.getOrderItemsCount(
          order,
          savedOrders,
          salesOrderItems,
        );
        const currentOrderItems = salesOrderItems.slice(
          itemIndex,
          itemIndex + itemsForOrder,
        );

        currentOrderItems.forEach((item) => {
          item.order_id = order.id;
        });

        itemIndex += itemsForOrder;
      }

      await this.salesOrderItemRepository.save(salesOrderItems);

      console.log(
        `✅ Sales orders seeded successfully (${savedOrders.length} orders with ${salesOrderItems.length} items created)`,
      );
    } else {
      console.log('⚠️  Sales orders already exist, skipping seed');
    }
  }

  private getRandomVariants(
    variants: ProductVariantEntity[],
    count: number,
  ): ProductVariantEntity[] {
    const shuffled = [...variants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getRandomOrderStatus(): OrderStatusEnum {
    const statuses = [
      OrderStatusEnum.PENDING,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.PROCESSING,
      OrderStatusEnum.SHIPPED,
      OrderStatusEnum.DELIVERED,
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getOrderItemsCount(
    order: SalesOrderEntity,
    orders: SalesOrderEntity[],
    allItems: Partial<SalesOrderItemEntity>[],
  ): number {
    // Calculate average items per order
    const totalOrders = orders.length;
    const totalItems = allItems.length;
    const avgItemsPerOrder = Math.ceil(totalItems / totalOrders);

    // Return a reasonable number between 1-4
    return Math.min(Math.max(1, avgItemsPerOrder), 4);
  }
}
