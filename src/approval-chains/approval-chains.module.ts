import { Module } from '@nestjs/common';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { ApprovalChainPersistenceModule } from '@/approval-chains/persistence/persistence.module';
import { AdminApprovalChainsController } from '@/approval-chains/controllers/admin-approval-chains.controller';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';

@Module({
  imports: [ApprovalChainPersistenceModule, UserPersistenceModule],
  controllers: [AdminApprovalChainsController],
  providers: [ApprovalChainsService],
  exports: [ApprovalChainsService, ApprovalChainPersistenceModule],
})
export class ApprovalChainsModule {}
