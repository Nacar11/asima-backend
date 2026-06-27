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
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { TimeCorrectionRequestRecord } from './domain/time-correction-request';
import { TimeCorrectionRequest } from './domain/time-correction-request.aggregate';
import {
  TimeCorrectionApproved,
  TimeCorrectionCancelled,
  TimeCorrectionRejected,
  TimeCorrectionSubmitted,
} from './domain/events/time-correction-request-events';
import { User } from '@/users/domain/user';

function tc(partial: Partial<TimeCorrectionRequestRecord>): TimeCorrectionRequestRecord {
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

/** Reconstituted aggregate for the write paths (approve/reject/cancel). */
function aggregate(partial: Partial<TimeCorrectionRequestRecord>): TimeCorrectionRequest {
  return TimeCorrectionRequest.reconstitute(tc(partial));
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
  let publisher: jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findAggregateById: jest.fn(),
      findActiveForEmployeeDate: jest.fn().mockResolvedValue([]),
      findActiveForEntry: jest.fn().mockResolvedValue([]),
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
      // Ownership guard: by default the target entry belongs to employee 12.
      findById: jest
        .fn()
        .mockImplementation((id: number) => Promise.resolve({ id, employee_id: 12 })),
    } as unknown as jest.Mocked<TimeEntriesService>;
    publisher = { publish: jest.fn() } as unknown as jest.Mocked<DomainEventPublisher>;
    service = new TimeCorrectionRequestsService(repo, chains, users, timeEntries, publisher);
  });

  const input = {
    employee_id: 12,
    work_date: '2026-06-10',
    proposed_time_in: new Date('2026-06-10T09:00:00Z'),
    proposed_time_out: new Date('2026-06-10T18:00:00Z'),
    reason: 'Forgot to clock in',
  };

  describe('findByIdForViewer', () => {
    const row = () => tc({ employee_id: 12, l1_approver_id: 5, l2_approver_id: 7 });

    it('allows the requester', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(service.findByIdForViewer(1, user(12))).resolves.toBeDefined();
    });

    it('allows the L1 approver', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(service.findByIdForViewer(1, user(5))).resolves.toBeDefined();
    });

    it('allows the L2 approver', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(service.findByIdForViewer(1, user(7))).resolves.toBeDefined();
    });

    it('allows a viewer with TIME_CORRECTION:ViewAll', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(
        service.findByIdForViewer(1, user(99, { codes: ['TIME_CORRECTION:ViewAll'] })),
      ).resolves.toBeDefined();
    });

    it('allows a system_admin', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(
        service.findByIdForViewer(1, user(99, { system_admin: true })),
      ).resolves.toBeDefined();
    });

    it('forbids an unrelated user without ViewAll (403) — even though the route is JWT-only', async () => {
      repo.findById.mockResolvedValue(row());
      await expect(service.findByIdForViewer(1, user(99))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('submit', () => {
    it('snapshots the chain and starts pending_l1', async () => {
      await service.submit(input, user(12, { codes: ['TIME_CORRECTION:Create'] }));
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
    });

    it('publishes TimeCorrectionSubmitted post-commit with the persisted id', async () => {
      await service.submit(input, user(12, { codes: ['TIME_CORRECTION:Create'] }));
      expect(publisher.publish).toHaveBeenCalledTimes(1);
      const events = publisher.publish.mock.calls[0][0];
      expect(events[0]).toBeInstanceOf(TimeCorrectionSubmitted);
      expect((events[0] as TimeCorrectionSubmitted).time_correction_request_id).toBe(1);
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

    // Guards C1 / decision #5: when multiple rules are violated, the 422 that
    // fires first must be the chain check (an I/O guard that runs BEFORE the
    // pure new-log contract), NOT proposed_time_out. Proves assertNewLogContract
    // was not front-loaded ahead of the chain/dedup I/O.
    it('a new-log with no time_out AND no L1 returns the chain 422 first (ordering parity)', async () => {
      chains.getActive.mockResolvedValue({ l1_approver_id: null, l2_approver_id: null });
      await expect(
        service.submit({ ...input, target_entry_id: null, proposed_time_out: null }, user(12)),
      ).rejects.toMatchObject({ response: { errors: { approval_chain: expect.any(String) } } });
    });
  });

  describe('submit — ownership + per-entry uniqueness', () => {
    const actor = () => user(12, { codes: ['TIME_CORRECTION:Create'] });

    it('blocks correcting another employee’s entry (ownership, C1)', async () => {
      timeEntries.findById.mockResolvedValue({ id: 50, employee_id: 999 } as never);
      await expect(
        service.submit({ ...input, target_entry_id: 50 }, actor()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('blocks a second active correction for the SAME entry (422)', async () => {
      repo.findActiveForEntry.mockResolvedValue([tc({ id: 99, target_entry_id: 50 })]);
      await expect(
        service.submit({ ...input, target_entry_id: 50 }, actor()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('ALLOWS a correction on a different same-day entry', async () => {
      repo.findActiveForEntry.mockResolvedValue([]);
      await service.submit({ ...input, target_entry_id: 51 }, actor());
      expect(repo.findActiveForEntry).toHaveBeenCalledWith(51);
      expect(repo.create).toHaveBeenCalled();
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
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await service.approve(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }));
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'pending_l2' }),
      );
    });

    it('applies the correction to the timesheet on final approval', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l2', l2_approver_id: 7, target_entry_id: 88 }),
      );
      await service.approve(1, user(7, { codes: ['TIME_CORRECTION:Approve'] }));
      expect(timeEntries.applyCorrection).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 12, target_entry_id: 88, decided_by: 7 }),
      );
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'approved' }));
    });

    it('writes the timesheet BEFORE persisting the request (decision #7 ordering)', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l2', l2_approver_id: 7, target_entry_id: 88 }),
      );
      await service.approve(1, user(7, { codes: ['TIME_CORRECTION:Approve'] }));
      const applyOrder = timeEntries.applyCorrection.mock.invocationCallOrder[0];
      const updateOrder = repo.update.mock.invocationCallOrder[0];
      expect(applyOrder).toBeLessThan(updateOrder);
    });

    it('publishes TimeCorrectionApproved on final approval', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l2', l2_approver_id: 7, target_entry_id: 88 }),
      );
      await service.approve(1, user(7, { codes: ['TIME_CORRECTION:Approve'] }));
      const events = publisher.publish.mock.calls[0][0];
      expect(events[0]).toBeInstanceOf(TimeCorrectionApproved);
    });

    it('if applyCorrection throws: no persist, no publish, request stays pending', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l2', l2_approver_id: 7, target_entry_id: 88 }),
      );
      timeEntries.applyCorrection.mockRejectedValue(new Error('timesheet write failed'));
      await expect(
        service.approve(1, user(7, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toThrow('timesheet write failed');
      expect(repo.update).not.toHaveBeenCalled();
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('override jumps straight to approved and applies the correction', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({
          status: 'pending_l1',
          l1_approver_id: 5,
          l2_approver_id: 7,
          target_entry_id: 88,
        }),
      );
      await service.approve(1, user(42, { codes: ['TIME_CORRECTION:ApproveAny'] }));
      expect(timeEntries.applyCorrection).toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'approved', decision_path: 'override' }),
      );
    });

    it('forbids an off-chain approver (403)', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l1', l1_approver_id: 5 }),
      );
      await expect(
        service.approve(1, user(99, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
    });

    it('409 when the assigned approver is deactivated', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: null }),
      );
      users.findById.mockResolvedValue(user(5, { is_active: false }));
      await expect(
        service.approve(1, user(5, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(timeEntries.applyCorrection).not.toHaveBeenCalled();
    });

    it('404 when the request does not exist', async () => {
      repo.findAggregateById.mockResolvedValue(null);
      await expect(
        service.approve(1, user(5, { codes: ['TIME_CORRECTION:Approve'] })),
      ).rejects.toThrow('not found');
    });
  });

  describe('reject + cancel', () => {
    it('rejects with a note and publishes Rejected', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l1', l1_approver_id: 5 }),
      );
      await service.reject(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }), 'Wrong time');
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'rejected' }));
      expect(publisher.publish.mock.calls[0][0][0]).toBeInstanceOf(TimeCorrectionRejected);
    });

    it('requires a rejection note (422)', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ status: 'pending_l1', l1_approver_id: 5 }),
      );
      await expect(
        service.reject(1, user(5, { codes: ['TIME_CORRECTION:Approve'] }), ' '),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('requester cancels their own pending request and publishes Cancelled', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ employee_id: 12, status: 'pending_l1' }),
      );
      await service.cancel(1, user(12));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'cancelled' }));
      expect(publisher.publish.mock.calls[0][0][0]).toBeInstanceOf(TimeCorrectionCancelled);
    });

    it('forbids a non-owner without HR rights from cancelling (403)', async () => {
      repo.findAggregateById.mockResolvedValue(
        aggregate({ employee_id: 12, status: 'pending_l1' }),
      );
      await expect(service.cancel(1, user(999))).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('409 when cancelling a non-pending request', async () => {
      repo.findAggregateById.mockResolvedValue(aggregate({ employee_id: 12, status: 'approved' }));
      await expect(service.cancel(1, user(12))).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
