import { ApprovalChain } from '@/approval-chains/domain/approval-chain';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';

export class ApprovalChainMapper {
  static toDomain(raw: ApprovalChainEntity): ApprovalChain {
    const ac = new ApprovalChain();
    ac.id = raw.id;
    ac.employee_id = raw.employee_id;
    ac.step = raw.step;
    ac.approver_id = raw.approver_id;
    ac.effective_at = raw.effective_at;
    ac.ended_at = raw.ended_at;
    ac.created_by = raw.created_by;
    ac.updated_by = raw.updated_by;
    ac.created_at = raw.created_at;
    ac.updated_at = raw.updated_at;
    return ac;
  }
}
