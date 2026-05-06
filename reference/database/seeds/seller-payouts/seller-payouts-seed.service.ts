import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerPayoutEntity } from '@/seller-payouts/persistence/entities/seller-payout.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding seller payouts
 */
@Injectable()
export class SellerPayoutsSeedService implements ISeedService {
  constructor(
    @InjectRepository(SellerPayoutEntity)
    private repository: Repository<SellerPayoutEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
  ) {}

  down(): Promise<void> {
    console.log(
      '⚠️  Nothing to rollback for seller payouts (seed is skipped).',
    );
    return Promise.resolve();
  }

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const sellers = await this.sellerRepository.find({ take: 1 });

      if (sellers.length === 0) {
        console.log('⚠️  No sellers found. Skipping seller payouts seed.');
        return;
      }

      // Seller payouts require earnings, so we'll skip seeding for now
      // They should be created through the normal payout flow
      console.log(
        '⚠️  Seller payouts seed skipped. They should be created through the normal payout flow.',
      );
    }
  }
}
