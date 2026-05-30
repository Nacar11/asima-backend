import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ApprovalChainsService } from './approval-chains.service';
import { BaseApprovalChainRepository } from './persistence/base-approval-chain.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChain } from './domain/approval-chain';
import { User } from '@/users/domain/user';
import { APPROVAL_STEP } from './approval-chains.constants';

function chainRow(
  partial: Partial<ApprovalChain> & { step: number; approver_id: number },
): ApprovalChain {
  return {
    id: partial.id ?? 1,
    employee_id: partial.employee_id ?? 12,
    step: partial.step,
    approver_id: partial.approver_id,
    effective_at: partial.effective_at ?? new Date('2026-05-30'),
    ended_at: partial.ended_at ?? null,
    created_by: partial.created_by ?? 1,
    updated_by: partial.updated_by ?? 1,
    created_at: partial.created_at ?? new Date('2026-05-30'),
    updated_at: partial.updated_at ?? new Date('2026-05-30'),
  };
}

function activeUser(id: number): User {
  return { id, is_active: true } as User;
}

describe('ApprovalChainsService', () => {
  let service: ApprovalChainsService;
  let repo: jest.Mocked<BaseApprovalChainRepository>;
  let users: jest.Mocked<BaseUserRepository>;

  beforeEach(() => {
    repo = {
      findActiveForEmployee: jest.fn().mockResolvedValue([]),
      findActiveByApprover: jest.fn().mockResolvedValue([]),
      findAllForEmployee: jest.fn().mockResolvedValue([]),
      listEmployeesWithChains: jest.fn(),
      applyStepChanges: jest.fn().mockResolvedValue(undefined),
    };
    users = {
      findById: jest.fn().mockImplementation((id: number) => Promise.resolve(activeUser(id))),
    } as unknown as jest.Mocked<BaseUserRepository>;
    service = new ApprovalChainsService(repo, users);
  });

  describe('setChain', () => {
    it('inserts two new rows when setting L1 + L2 on an employee with no chain', async () => {
      repo.findActiveForEmployee.mockResolvedValue([]);
      await service.setChain(12, { l1_approver_id: 5, l2_approver_id: 7 }, 1);

      expect(repo.applyStepChanges).toHaveBeenCalledTimes(1);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([]);
      expect(arg.inserts).toEqual([
        { employee_id: 12, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 12, step: 2, approver_id: 7, created_by: 1 },
      ]);
    });

    it('ends the old L1 row and inserts a new one when L1 changes', async () => {
      repo.findActiveForEmployee.mockResolvedValue([chainRow({ id: 99, step: 1, approver_id: 5 })]);
      await service.setChain(12, { l1_approver_id: 8 }, 1);

      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([99]);
      expect(arg.inserts).toEqual([{ employee_id: 12, step: 1, approver_id: 8, created_by: 1 }]);
    });

    it('is a no-op when the submitted approver already matches the active row', async () => {
      repo.findActiveForEmployee.mockResolvedValue([chainRow({ id: 99, step: 1, approver_id: 5 })]);
      await service.setChain(12, { l1_approver_id: 5 }, 1);
      expect(repo.applyStepChanges).not.toHaveBeenCalled();
    });

    it('clears L2 when sent null (ends the row, no insert)', async () => {
      repo.findActiveForEmployee.mockResolvedValue([
        chainRow({ id: 1, step: 1, approver_id: 5 }),
        chainRow({ id: 2, step: 2, approver_id: 7 }),
      ]);
      await service.setChain(12, { l2_approver_id: null }, 1);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([2]);
      expect(arg.inserts).toEqual([]);
    });

    it('rejects self-assignment (approver === employee) with 422', async () => {
      await expect(service.setChain(12, { l1_approver_id: 12 }, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.applyStepChanges).not.toHaveBeenCalled();
    });

    it('rejects an inactive approver with 422', async () => {
      users.findById.mockImplementation((id: number) =>
        Promise.resolve(id === 9 ? ({ id: 9, is_active: false } as User) : activeUser(id)),
      );
      await expect(service.setChain(12, { l1_approver_id: 9 }, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('rejects assigning L2 without an L1 (422)', async () => {
      repo.findActiveForEmployee.mockResolvedValue([]);
      await expect(service.setChain(12, { l2_approver_id: 7 }, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws 404 when the employee does not exist', async () => {
      users.findById.mockImplementation((id: number) =>
        Promise.resolve(id === 12 ? null : activeUser(id)),
      );
      await expect(service.setChain(12, { l1_approver_id: 5 }, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('endStep', () => {
    it('ends the active L2 row', async () => {
      repo.findActiveForEmployee.mockResolvedValue([
        chainRow({ id: 1, step: 1, approver_id: 5 }),
        chainRow({ id: 2, step: 2, approver_id: 7 }),
      ]);
      await service.endStep(12, APPROVAL_STEP.L2, 1);
      expect(repo.applyStepChanges).toHaveBeenCalledWith({ ends: [2], inserts: [], actor_id: 1 });
    });

    it('refuses to end L1 while L2 is still assigned (422)', async () => {
      repo.findActiveForEmployee.mockResolvedValue([
        chainRow({ id: 1, step: 1, approver_id: 5 }),
        chainRow({ id: 2, step: 2, approver_id: 7 }),
      ]);
      await expect(service.endStep(12, APPROVAL_STEP.L1, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws 404 when there is no active row for the step', async () => {
      repo.findActiveForEmployee.mockResolvedValue([]);
      await expect(service.endStep(12, APPROVAL_STEP.L1, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('bulkReassign', () => {
    it('ends every active row for the old approver and inserts mirrors for the new one', async () => {
      repo.findActiveByApprover.mockResolvedValue([
        chainRow({ id: 10, employee_id: 20, step: 1, approver_id: 5 }),
        chainRow({ id: 11, employee_id: 21, step: 2, approver_id: 5 }),
      ]);
      const result = await service.bulkReassign(5, 8, 1);

      expect(result).toEqual({ reassigned: 2, skipped: [] });
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([10, 11]);
      expect(arg.inserts).toEqual([
        { employee_id: 20, step: 1, approver_id: 8, created_by: 1 },
        { employee_id: 21, step: 2, approver_id: 8, created_by: 1 },
      ]);
    });

    it('skips a row where the employee would become their own approver', async () => {
      repo.findActiveByApprover.mockResolvedValue([
        chainRow({ id: 10, employee_id: 8, step: 1, approver_id: 5 }),
        chainRow({ id: 11, employee_id: 21, step: 1, approver_id: 5 }),
      ]);
      const result = await service.bulkReassign(5, 8, 1);

      expect(result.reassigned).toBe(1);
      expect(result.skipped).toEqual([8]);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([11]);
    });

    it('rejects from === to with 422', async () => {
      await expect(service.bulkReassign(5, 5, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe('getActive', () => {
    it('returns L1/L2 approver ids from the active rows', async () => {
      repo.findActiveForEmployee.mockResolvedValue([
        chainRow({ id: 1, step: 1, approver_id: 5 }),
        chainRow({ id: 2, step: 2, approver_id: 7 }),
      ]);
      await expect(service.getActive(12)).resolves.toEqual({
        l1_approver_id: 5,
        l2_approver_id: 7,
      });
    });

    it('returns nulls when no chain is assigned', async () => {
      repo.findActiveForEmployee.mockResolvedValue([]);
      await expect(service.getActive(12)).resolves.toEqual({
        l1_approver_id: null,
        l2_approver_id: null,
      });
    });
  });
});
