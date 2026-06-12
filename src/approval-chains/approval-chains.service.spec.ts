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
      findActiveForEmployees: jest.fn().mockResolvedValue([]),
      findActiveByApprover: jest.fn().mockResolvedValue([]),
      findAllForEmployee: jest.fn().mockResolvedValue([]),
      listEmployeesWithChains: jest.fn(),
      listEmployeeIds: jest.fn().mockResolvedValue([]),
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

  describe('bulkAssign', () => {
    it('inserts an L1 row for every selected employee with no prior chain', async () => {
      repo.findActiveForEmployees.mockResolvedValue([]);
      const result = await service.bulkAssign([20, 21, 22], { l1_approver_id: 5 }, 1);

      expect(result).toEqual({ assigned: 3, skipped: [] });
      expect(repo.applyStepChanges).toHaveBeenCalledTimes(1);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([]);
      expect(arg.inserts).toEqual([
        { employee_id: 20, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 21, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 22, step: 1, approver_id: 5, created_by: 1 },
      ]);
    });

    it('inserts both L1 and L2 rows per employee when L2 is provided', async () => {
      repo.findActiveForEmployees.mockResolvedValue([]);
      const result = await service.bulkAssign(
        [20, 21],
        { l1_approver_id: 5, l2_approver_id: 7 },
        1,
      );

      expect(result.assigned).toBe(2);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.inserts).toEqual([
        { employee_id: 20, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 20, step: 2, approver_id: 7, created_by: 1 },
        { employee_id: 21, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 21, step: 2, approver_id: 7, created_by: 1 },
      ]);
    });

    it('ends an existing L1 row before inserting the replacement (overwrite)', async () => {
      repo.findActiveForEmployees.mockResolvedValue([
        chainRow({ id: 90, employee_id: 20, step: 1, approver_id: 3 }),
      ]);
      await service.bulkAssign([20], { l1_approver_id: 5 }, 1);

      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.ends).toEqual([90]);
      expect(arg.inserts).toEqual([{ employee_id: 20, step: 1, approver_id: 5, created_by: 1 }]);
    });

    it('skips an employee who IS the chosen approver and reports self_approval', async () => {
      repo.findActiveForEmployees.mockResolvedValue([]);
      const result = await service.bulkAssign([5, 21], { l1_approver_id: 5 }, 1);

      expect(result.assigned).toBe(1);
      expect(result.skipped).toEqual([{ employee_id: 5, reason: 'self_approval' }]);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.inserts).toEqual([{ employee_id: 21, step: 1, approver_id: 5, created_by: 1 }]);
    });

    it('skips an employee who equals the chosen L2 approver', async () => {
      repo.findActiveForEmployees.mockResolvedValue([]);
      const result = await service.bulkAssign([7, 21], { l1_approver_id: 5, l2_approver_id: 7 }, 1);

      expect(result.skipped).toEqual([{ employee_id: 7, reason: 'self_approval' }]);
      expect(result.assigned).toBe(1);
    });

    it('does not double-insert when an employee already has the chosen approver at that step', async () => {
      repo.findActiveForEmployees.mockResolvedValue([
        chainRow({ id: 90, employee_id: 20, step: 1, approver_id: 5 }),
      ]);
      const result = await service.bulkAssign([20], { l1_approver_id: 5 }, 1);

      expect(result.assigned).toBe(0);
      expect(repo.applyStepChanges).not.toHaveBeenCalled();
    });

    it('dedupes repeated employee_ids', async () => {
      repo.findActiveForEmployees.mockResolvedValue([]);
      await service.bulkAssign([20, 20, 21], { l1_approver_id: 5 }, 1);

      expect(repo.findActiveForEmployees).toHaveBeenCalledWith([20, 21]);
      const arg = repo.applyStepChanges.mock.calls[0][0];
      expect(arg.inserts).toEqual([
        { employee_id: 20, step: 1, approver_id: 5, created_by: 1 },
        { employee_id: 21, step: 1, approver_id: 5, created_by: 1 },
      ]);
    });

    it('rejects an inactive L1 approver with 422', async () => {
      users.findById.mockImplementation((id: number) =>
        Promise.resolve(id === 9 ? ({ id: 9, is_active: false } as User) : activeUser(id)),
      );
      await expect(service.bulkAssign([20], { l1_approver_id: 9 }, 1)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.applyStepChanges).not.toHaveBeenCalled();
    });

    it('rejects an empty employee list with 422', async () => {
      await expect(service.bulkAssign([], { l1_approver_id: 5 }, 1)).rejects.toBeInstanceOf(
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

  describe('listIds', () => {
    it('forwards the criteria to the repository and wraps the ids', async () => {
      repo.listEmployeeIds.mockResolvedValue([20, 21, 22]);
      await expect(service.listIds({ unassigned: true })).resolves.toEqual({
        employee_ids: [20, 21, 22],
      });
      expect(repo.listEmployeeIds).toHaveBeenCalledWith({ unassigned: true });
    });
  });
});
