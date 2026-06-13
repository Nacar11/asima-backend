import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TimeCorrectionRequestsService } from './time-correction-requests.service';
import { BaseTimeCorrectionRequestRepository } from './persistence/base-time-correction-request.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeCorrectionRequest } from './domain/time-correction-request';
import { User } from '@/users/domain/user';

function tc(partial: Partial<TimeCorrectionRequest>): TimeCorrectionRequest {
  return {
    id: 1,
    employee_id: 12,
    target_entry_id: null,
    original_time_in: null,
    original_time_out: null,
    work_date: '2026-06-10',
    proposed_time_in: new Date('2026-06-10T09:00:00Z'),
    proposed_time_out: new Date('2026-06-10T18:00:00Z'),
    reason: 'Forgot to clock in',
    status: 'pending_l1',
    submitted_at: new Date('2026-06-09'),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: 7,
    created_by: 12,
    updated_by: 12,
    deleted_by: null,
    created_at: new Date('2026-06-09'),
    updated_at: new Date('2026-06-09'),
    deleted_at: null,
    ...partial,
  };
}

function user(
  id: number,
  opts: { system_admin?: boolean; is_active?: boolean; codes?: string[] } = {},
): User {
  return {
    id,
    system_admin: opts.system_admin ?? false,
    is_active: opts.is_active ?? true,
    role: { permissions: (opts.codes ?? []).map((code) => ({ code })) },
  } as unknown as User;
}

describe('TimeCorrectionRequestsService', () => {
  let service: TimeCorrectionRequestsService;
  let repo: jest.Mocked<BaseTimeCorrectionRequestRepository>;
  let chains: jest.Mocked<ApprovalChainsService>;
  let users: jest.Mocked<BaseUserRepository>;
  let timeEntries: jest.Mocked<TimeEntriesService>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findActiveForEmployeeDate: jest.fn().mockResolvedValue([]),
      findPendingForApprover: jest.fn(),
      findAllPending: jest.fn(),
      create: jest.fn().mockImplementation((input) => Promise.resolve(tc(input))),
      update: jest.fn().mockImplementation((id, patch) => Promise.resolve(tc({ id, ...patch }))),
    } as unknown as jest.Mocked<BaseTimeCorrectionRequestRepository>;
    chains = {
      getActive: jest.fn().mockResolvedValue({ l1_approver_id: 5, l2_approver_id: 7 }),
    } as unknown as jest.Mocked<ApprovalChainsService>;
    users = {
      findById: jest.fn().mockImplementation((id: number) => Promise.resolve(user(id))),
    } as unknown as jest.Mocked<BaseUserRepository>;
    timeEntries = {
      applyCorrection: jest.fn().mockResolvedValue({ id: 999 }),
      hasEntryOnDate: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<TimeEntriesService>;
    service = new TimeCorrectionRequestsService(repo, chains, users, timeEntries);
  });

  const input = {
    employee_id: 12,
    work_date: '2026-06-10',
    proposed_time_in: new Date('2026-06-10T09:00:00Z'),
    proposed_time_out: new Date('2026-06-10T18:00:00Z'),
    reason: 'Forgot to clock in',
  };

  describe('submit', () => {
    it('snapshots the chain and starts pending_l1', async () => {
      await service.submit(input, user(12, { codes: ['TIME_CORRECTION:Create'] }));
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
    });

    it('hard-blocks when no L1 chain is assigned (422)', async () => {
      chains.getActive.mockResolvedValue({ l1_approver_id: null, l2_approver_id: null });
      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('rejects a duplicate pending/approved correction for the same date (422)', async () => {
      repo.findActiveForEmployeeDate.mockResolvedValue([tc({ id: 50 })]);
      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('rejects proposed_time_out <= proposed_time_in (422)', async () => {
      await expect(
        service.submit({ ...input, proposed_time_out: new Date('2026-06-10T08:00:00Z') }, user(12)),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('submit — manual-add (null target) guards', () => {
    const actor = () => user(12, { codes: ['TIME_CORRECTION:Create'] });

    it('rejects a future work_date (422)', async () => {
      await expect(
        service.submit({ ...input, target_entry_id: null, work_date: '2099-01-01' }, actor()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('rejects when an entry already exists for the date (422)', async () => {
      timeEntries.hasEntryOnDate.mockResolvedValue(true);
      await expect(
        service.submit({ ...input, target_entry_id: null }, actor()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('requires proposed_time_out for a manual add (422)', async () => {
      await expect(
        service.submit({ ...input, target_entry_id: null, proposed_time_out: null }, actor()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('does NOT apply manual-add guards when target_entry_id is set', async () => {
      // A correction targeting an existing entry: out may be null, and the
      // existing-entry / future-date guards don't run.
      await service.submit({ ...input, target_entry_id: 88, proposed_time_out: null }, actor());
      expect(timeEntries.hasEntryOnDate).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('advances pending_l1 → pending_l2 WITHOUT touching the timesheet', async () => {
      repo.findById.mockResolvedValue(
        tc({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await service.approve(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }));
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'pending_l2' }),
      );
    });

    it('applies the correction to the timesheet on final approval', async () => {
      repo.findById.mockResolvedValue(
        tc({ status: 'pending_l2', l2_approver_id: 7, target_entry_id: 88 }),
      );
      await service.approve(1, user(7, { codes: ['TIME_CORRECTION:Approve'] }));
      expect(timeEntries.applyCorrection).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 12, target_entry_id: 88, decided_by: 7 }),
      );
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'approved' }));
    });

    it('override jumps straight to approved and applies the correction', async () => {
      repo.findById.mockResolvedValue(
        tc({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await service.approve(1, user(42, { codes: ['TIME_CORRECTION:ApproveAny'] }));
      expect(timeEntries.applyCorrection).toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'approved', decision_path: 'override' }),
      );
    });

    it('forbids an off-chain approver (403)', async () => {
      repo.findById.mockResolvedValue(tc({ status: 'pending_l1', l1_approver_id: 5 }));
      await expect(
        service.approve(1, user(99, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
    });

    it('409 when the assigned approver is deactivated', async () => {
      repo.findById.mockResolvedValue(
        tc({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: null }),
      );
      users.findById.mockResolvedValue(user(5, { is_active: false }));
      await expect(
        service.approve(1, user(5, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
    });
  });

  describe('reject + cancel', () => {
    it('rejects with a note', async () => {
      repo.findById.mockResolvedValue(tc({ status: 'pending_l1', l1_approver_id: 5 }));
      await service.reject(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }), 'Wrong time');
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'rejected' }));
    });

    it('requires a rejection note (422)', async () => {
      repo.findById.mockResolvedValue(tc({ status: 'pending_l1', l1_approver_id: 5 }));
      await expect(
        service.reject(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }), ' '),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('requester cancels their own pending request', async () => {
      repo.findById.mockResolvedValue(tc({ employee_id: 12, status: 'pending_l1' }));
      await service.cancel(1, user(12));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'cancelled' }));
    });
  });
});
