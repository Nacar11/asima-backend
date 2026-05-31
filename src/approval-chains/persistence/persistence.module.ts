import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';
import { ApprovalChainRepository } from '@/approval-chains/persistence/repositories/approval-chain.repository';
import { BaseApprovalChainRepository } from '@/approval-chains/persistence/base-approval-chain.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalChainEntity])],
  providers: [
    ApprovalChainRepository,
    { provide: BaseApprovalChainRepository, useClass: ApprovalChainRepository },
  ],
  exports: [BaseApprovalChainRepository, ApprovalChainRepository, TypeOrmModule],
})
export class ApprovalChainPersistenceModule {}
