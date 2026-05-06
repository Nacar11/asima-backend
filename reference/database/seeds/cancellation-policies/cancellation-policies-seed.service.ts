import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { CancellationPolicyEntity } from '@/cancellation-policies/persistence/entities/cancellation-policy.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

/**
 * Service for seeding cancellation policies
 */
@Injectable()
export class CancellationPoliciesSeedService implements ISeedService {
  constructor(
    @InjectRepository(CancellationPolicyEntity)
    private repository: Repository<CancellationPolicyEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const sellers = await this.sellerRepository.find({ take: 1 });

      if (sellers.length === 0) {
        console.log(
          '⚠️  No sellers found. Skipping cancellation policies seed.',
        );
        return;
      }

      // Create default platform cancellation policy
      const policies = [
        {
          seller_id: null,
          service_id: null,
          name: 'Platform Default Policy',
          description: 'Default cancellation policy for all services',
          free_cancel_hours: 48,
          partial_cancel_hours: 24,
          partial_cancel_percent: 50.0,
          no_show_charge_percent: 100.0,
          is_active: true,
        },
      ];

      await this.repository.save(
        policies.map((policy) => this.repository.create(policy)),
      );

      console.log(
        `✅ ${policies.length} cancellation policies seeded successfully`,
      );
    }
  }
}
