import { Injectable } from '@nestjs/common';
// Note: This seeder is for checkout_order_items table if it exists
// Currently, checkout orders are created directly from shopping cart items
// without intermediate checkout order items. This seeder serves as a placeholder.

/**
 * Service for seeding checkout order items
 * Note: This may not be needed as checkout orders are created from shopping cart items directly
 */
@Injectable()
export class CheckoutOrderItemsSeedService {
  constructor() {} // private repository: Repository<CheckoutOrderItemEntity>, // @InjectRepository(CheckoutOrderItemEntity)

  async run(): Promise<void> {
    await Promise.resolve();
    // Checkout orders are created from shopping cart items directly
    // No separate checkout_order_items table exists
    // This seeder is a placeholder for potential future use

    console.log(
      '⚠️  Checkout order items seeder skipped - checkout orders created from shopping cart items directly',
    );
  }
}
