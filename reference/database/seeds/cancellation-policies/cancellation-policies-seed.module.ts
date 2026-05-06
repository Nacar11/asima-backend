import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationPolicyEntity } from '@/cancellation-policies/persistence/entities/cancellation-policy.entity';
import { CancellationPoliciesSeedService } from '@/database/seeds/cancellation-policies/cancellation-policies-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

/**
 * Seed module for cancellation policies
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CancellationPolicyEntity,
      SellerEntity,
      ServiceEntity,
    ]),
  ],
  providers: [CancellationPoliciesSeedService],
  exports: [CancellationPoliciesSeedService],
})
export class CancellationPoliciesSeedModule {}
