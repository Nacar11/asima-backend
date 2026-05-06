import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { CheckoutStatusEnum } from '@/checkout-orders/enums/checkout-status.enum';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';

/**
 * Service for seeding checkout orders
 */
@Injectable()
export class CheckoutOrdersSeedService {
  constructor(
    @InjectRepository(CheckoutOrderEntity)
    private repository: Repository<CheckoutOrderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const users = await this.userRepository.find({ take: 2 });
      const currencies = await this.currencyRepository.find({ take: 1 });

      if (users.length === 0) {
        console.log('⚠️  No users found. Skipping checkout orders seed.');
        return;
      }

      if (currencies.length === 0) {
        console.log('⚠️  No currencies found. Skipping checkout orders seed.');
        return;
      }

      const checkoutOrders: Array<{
        user_id: number;
        order_number: string;
        has_products: boolean;
        has_services: boolean;
        has_bundles: boolean;
        subtotal: number;
        discount_total: number;
        shipping_total: number;
        tax_total: number;
        platform_fee_total: number;
        grand_total: number;
        currency_id: number;
        status: CheckoutStatusEnum;
        payment_status: PaymentStatusEnum;
        customer_notes?: string;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // Create checkout order for testing booking creation
      checkoutOrders.push({
        user_id: users[0].id,
        order_number: 'CO-TEST-001',
        has_products: false,
        has_services: true, // This is key for booking creation
        has_bundles: false,
        subtotal: 1500.0,
        discount_total: 0.0,
        shipping_total: 0.0,
        tax_total: 0.0,
        platform_fee_total: 150.0, // 10% of subtotal
        grand_total: 1500.0,
        currency_id: currencies[0].id,
        status: CheckoutStatusEnum.COMPLETED,
        payment_status: PaymentStatusEnum.PAID,
        customer_notes: 'Test checkout order for booking creation',
        created_by: users[0],
        updated_by: users[0],
      });

      // Create a second checkout order for additional testing
      if (users.length > 1) {
        checkoutOrders.push({
          user_id: users[1].id,
          order_number: 'CO-TEST-002',
          has_products: false,
          has_services: true,
          has_bundles: false,
          subtotal: 2500.0,
          discount_total: 0.0,
          shipping_total: 0.0,
          tax_total: 0.0,
          platform_fee_total: 250.0,
          grand_total: 2500.0,
          currency_id: currencies[0].id,
          status: CheckoutStatusEnum.COMPLETED,
          payment_status: PaymentStatusEnum.PAID,
          customer_notes: 'Second test checkout order',
          created_by: users[1],
          updated_by: users[1],
        });
      }

      await this.repository.save(
        checkoutOrders.map((order) => this.repository.create(order)),
      );

      console.log(
        `✅ ${checkoutOrders.length} checkout orders seeded successfully`,
      );
    }
  }
}
