import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationPolicyEntity } from './entities/cancellation-policy.entity';
import { BaseCancellationPolicyRepository } from './base-cancellation-policy.repository';
import { CancellationPolicyRepository } from './repositories/cancellation-policy.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CancellationPolicyEntity])],
  providers: [
    {
      provide: BaseCancellationPolicyRepository,
      useClass: CancellationPolicyRepository,
    },
  ],
  exports: [BaseCancellationPolicyRepository],
})
export class CancellationPolicyPersistenceModule {}
