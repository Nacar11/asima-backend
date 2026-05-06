import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerEarningEntity } from '@/seller-earnings/persistence/entities/seller-earning.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding seller earnings
 */
@Injectable()
export class SellerEarningsSeedService implements ISeedService {
  constructor(
    @InjectRepository(SellerEarningEntity)
    private repository: Repository<SellerEarningEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
  ) {}

  down(): Promise<void> {
    console.log(
      '⚠️  Nothing to rollback for seller earnings (seed is skipped).',
    );
    return Promise.resolve();
  }

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const sellers = await this.sellerRepository.find({ take: 1 });

      if (sellers.length === 0) {
        console.log('⚠️  No sellers found. Skipping seller earnings seed.');
        return;
      }

      // Seller earnings require completed orders/bookings, so we'll skip seeding for now
      // They should be created through the normal order/booking completion flow
      console.log(
        '⚠️  Seller earnings seed skipped. They should be created through the normal order/booking completion flow.',
      );
    }
  }
}
