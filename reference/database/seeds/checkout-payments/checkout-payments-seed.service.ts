import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';

/**
 * Service for seeding checkout payments
 */
@Injectable()
export class CheckoutPaymentsSeedService implements ISeedService {
  constructor(
    @InjectRepository(CheckoutPaymentEntity)
    private repository: Repository<CheckoutPaymentEntity>,
    @InjectRepository(CheckoutOrderEntity)
    private checkoutOrderRepository: Repository<CheckoutOrderEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const checkoutOrders = await this.checkoutOrderRepository.find({
        take: 1,
      });

      if (checkoutOrders.length === 0) {
        console.log(
          '⚠️  No checkout orders found. Skipping checkout payments seed.',
        );
        return;
      }

      // Checkout payments require checkout orders, so we'll skip seeding for now
      // They should be created through the normal payment flow
      console.log(
        '⚠️  Checkout payments seed skipped. They should be created through the normal payment flow.',
      );
    }
  }
}
