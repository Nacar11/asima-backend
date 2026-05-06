import { Module } from '@nestjs/common';
import { CancellationPoliciesController } from './cancellation-policies.controller';
import { CancellationPoliciesService } from './cancellation-policies.service';
import { CancellationPolicyPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [CancellationPolicyPersistenceModule],
  controllers: [CancellationPoliciesController],
  providers: [CancellationPoliciesService],
  exports: [CancellationPoliciesService, CancellationPolicyPersistenceModule],
})
export class CancellationPoliciesModule {}
