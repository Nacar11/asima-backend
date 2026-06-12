import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveDayCountService } from './leave-day-count.service';
import { BaseLeaveRequestRepository } from './persistence/base-leave-request.repository';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { AttachmentService } from '@/storage/attachment.service';
import { LeaveRequest } from './domain/leave-request';
import { User } from '@/users/domain/user';

function leave(partial: Partial<LeaveRequest>): LeaveRequest {
  return {
    id: 1,
    employee_id: 12,
    leave_type: 'vacation',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    working_days: 5,
    day_portion: 'full',
    start_time: null,
    end_time: null,
    reason: null,
    status: 'pending_l1',
    submitted_at: new Date('2026-05-30'),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: 7,
    attachment_id: null,
    created_by: 12,
    updated_by: 12,
    deleted_by: null,
    created_at: new Date('2026-05-30'),
    updated_at: new Date('2026-05-30'),
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

describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;
  let repo: jest.Mocked<BaseLeaveRequestRepository>;
  let chains: jest.Mocked<ApprovalChainsService>;
  let users: jest.Mocked<BaseUserRepository>;
  let dayCount: jest.Mocked<LeaveDayCountService>;
  let allocations: jest.Mocked<BaseLeaveAllocationRepository>;
  let attachments: jest.Mocked<Pick<AttachmentService, 'uploadForOwner' | 'persist' | 'cleanup'>>;
  let dataSource: { transaction: jest.Mock };

  /** A prepared-attachment handle as AttachmentService.uploadForOwner returns. */
  const preparedHandle = {
    object_key_prefix: 'leave-attachments/abc',
    original_filename: 'cert.png',
    content_type: 'image/png',
    size_bytes: 1024,
    kind: 'image' as const,
    has_versions: true,
    owner_id: 12,
    created_by: 12,
    uploaded_keys: [
      'leave-attachments/abc/original.png',
      'leave-attachments/abc/preview.webp',
      'leave-attachments/abc/thumbnail.webp',
    ],
  };
  const fakeFile = { buffer: Buffer.from('x'), originalname: 'cert.png' };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findOverlapping: jest.fn().mockResolvedValue([]),
      findPendingForApprover: jest.fn(),
      findAllPending: jest.fn(),
      sumConsumedForEmployeeType: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((input) => Promise.resolve(leave(input))),
      update: jest.fn().mockImplementation((id, patch) => Promise.resolve(leave({ id, ...patch }))),
    } as unknown as jest.Mocked<BaseLeaveRequestRepository>;
    chains = {
      getActive: jest.fn().mockResolvedValue({ l1_approver_id: 5, l2_approver_id: 7 }),
    } as unknown as jest.Mocked<ApprovalChainsService>;
    users = {
      findById: jest.fn().mockImplementation((id: number) => Promise.resolve(user(id))),
    } as unknown as jest.Mocked<BaseUserRepository>;
    dayCount = {
      assertSubmittableRange: jest
        .fn()
        .mockResolvedValue({ working_days: 3, start_time: null, end_time: null }),
      // Default "today" sits before the default leave window (ends 2026-06-05),
      // so a default-dated request is not yet elapsed. Past-date tests override.
      today: jest.fn().mockReturnValue('2026-06-01'),
    } as unknown as jest.Mocked<LeaveDayCountService>;
    allocations = {
      sumForUpdate: jest.fn().mockResolvedValue(10),
    } as unknown as jest.Mocked<BaseLeaveAllocationRepository>;
    attachments = {
      uploadForOwner: jest.fn().mockResolvedValue(preparedHandle),
      persist: jest.fn().mockResolvedValue({ id: 77 }),
      cleanup: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pick<AttachmentService, 'uploadForOwner' | 'persist' | 'cleanup'>>;
    // Run the transaction callback inline with a throwaway manager.
    dataSource = { transaction: jest.fn().mockImplementation((cb) => cb({} as never)) };
    service = new LeaveRequestsService(
      repo,
      chains,
      users,
      dayCount,
      allocations,
      attachments as unknown as AttachmentService,
      dataSource as never,
    );
  });

  describe('submit', () => {
    const input = {
      employee_id: 12,
      leave_type: 'vacation' as const,
      start_date: '2026-06-01',
      end_date: '2026-06-05',
    };

    it('snapshots the active chain and starts at pending_l1', async () => {
      await service.submit(input, user(12, { codes: ['LEAVE:Create'] }));
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending_l1',
          l1_approver_id: 5,
          l2_approver_id: 7,
          employee_id: 12,
        }),
        expect.anything(),
      );
    });

    it('persists day_portion + the half-day window and reserves 0.5 for a partial request', async () => {
      dayCount.assertSubmittableRange.mockResolvedValue({
        working_days: 0.5,
        start_time: '09:00:00',
        end_time: '14:00:00',
      });
      allocations.sumForUpdate.mockResolvedValue(10);
      repo.sumConsumedForEmployeeType.mockResolvedValue(0);

      await service.submit(
        { ...input, day_portion: 'first_half' },
        user(12, { codes: ['LEAVE:Create'] }),
      );

      expect(dayCount.assertSubmittableRange).toHaveBeenCalledWith(
        12,
        '2026-06-01',
        '2026-06-05',
        'first_half',
        'vacation',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          day_portion: 'first_half',
          working_days: 0.5,
          start_time: '09:00:00',
          end_time: '14:00:00',
        }),
        expect.anything(),
      );
    });

    it('snapshots the schedule-aware working_days returned by the day-count service', async () => {
      dayCount.assertSubmittableRange.mockResolvedValue({
        working_days: 2,
        start_time: null,
        end_time: null,
      });
      await service.submit(input, user(12, { codes: ['LEAVE:Create'] }));
      expect(dayCount.assertSubmittableRange).toHaveBeenCalledWith(
        12,
        '2026-06-01',
        '2026-06-05',
        'full',
        'vacation',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ working_days: 2 }),
        expect.anything(),
      );
    });

    it('hard-blocks submission when no L1 is assigned (422 approval_chain)', async () => {
      chains.getActive.mockResolvedValue({ l1_approver_id: null, l2_approver_id: null });
      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects an overlapping pending/approved request (422 dates)', async () => {
      repo.findOverlapping.mockResolvedValue([leave({ id: 99 })]);
      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('propagates a D8 date-rule rejection from the day-count service and does not create', async () => {
      dayCount.assertSubmittableRange.mockRejectedValue(
        new UnprocessableEntityException({ status: 422, errors: { start_date: 'past' } }),
      );
      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('reserves on submit: locks allocations and creates when available >= working_days', async () => {
      dayCount.assertSubmittableRange.mockResolvedValue({
        working_days: 2,
        start_time: null,
        end_time: null,
      });
      allocations.sumForUpdate.mockResolvedValue(10);
      repo.sumConsumedForEmployeeType.mockResolvedValue(8); // available = 2

      await service.submit(input, user(12, { codes: ['LEAVE:Create'] }));

      expect(allocations.sumForUpdate).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ working_days: 2 }),
        expect.anything(), // the transaction manager
      );
    });

    it('rejects with 422 balance when available < working_days and does not create', async () => {
      dayCount.assertSubmittableRange.mockResolvedValue({
        working_days: 3,
        start_time: null,
        end_time: null,
      });
      allocations.sumForUpdate.mockResolvedValue(10);
      repo.sumConsumedForEmployeeType.mockResolvedValue(8); // available = 2 < 3

      await expect(service.submit(input, user(12))).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    describe('attachments', () => {
      const sick = { ...input, leave_type: 'sick' as const };

      it('422 when sick leave is submitted without a file (no upload, no create)', async () => {
        await expect(
          service.submit(sick, user(12, { codes: ['LEAVE:Create'] })),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
        expect(attachments.uploadForOwner).not.toHaveBeenCalled();
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('422 when a non-attachment type (vacation) is submitted WITH a file', async () => {
        await expect(
          service.submit(input, user(12, { codes: ['LEAVE:Create'] }), fakeFile),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
        expect(attachments.uploadForOwner).not.toHaveBeenCalled();
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('uploads the file and links the new attachment id on a valid sick submit', async () => {
        await service.submit(sick, user(12, { codes: ['LEAVE:Create'] }), fakeFile);

        expect(attachments.uploadForOwner).toHaveBeenCalledWith(
          expect.objectContaining({ file: fakeFile, owner_id: 12, actor_id: 12 }),
        );
        // Persisted inside the transaction (manager passed through).
        expect(attachments.persist).toHaveBeenCalledWith(preparedHandle, expect.anything());
        expect(repo.create).toHaveBeenCalledWith(
          expect.objectContaining({ leave_type: 'sick', attachment_id: 77 }),
          expect.anything(),
        );
      });

      it('uploads BEFORE the transaction opens', async () => {
        const order: string[] = [];
        attachments.uploadForOwner.mockImplementation(async () => {
          order.push('upload');
          return preparedHandle;
        });
        dataSource.transaction.mockImplementation((cb) => {
          order.push('transaction');
          return cb({} as never);
        });

        await service.submit(sick, user(12, { codes: ['LEAVE:Create'] }), fakeFile);

        expect(order).toEqual(['upload', 'transaction']);
      });

      it('compensating-deletes the uploaded objects when the transaction fails', async () => {
        // Balance check fails inside the transaction, after the upload.
        allocations.sumForUpdate.mockResolvedValue(0); // available 0 < working_days

        await expect(
          service.submit(sick, user(12, { codes: ['LEAVE:Create'] }), fakeFile),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        expect(attachments.uploadForOwner).toHaveBeenCalled();
        expect(attachments.cleanup).toHaveBeenCalledWith(preparedHandle);
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('does not clean up on a successful submit', async () => {
        await service.submit(sick, user(12, { codes: ['LEAVE:Create'] }), fakeFile);
        expect(attachments.cleanup).not.toHaveBeenCalled();
      });
    });
  });

  describe('approve', () => {
    it('advances pending_l1 → pending_l2 when an L2 is snapshotted', async () => {
      repo.findById.mockResolvedValue(
        leave({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await service.approve(1, user(5, { codes: ['LEAVE:Approve'] }));
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'pending_l2', decided_by: 5, decision_path: 'chain' }),
      );
    });

    it('advances pending_l1 → approved when there is no L2 (single-step chain)', async () => {
      repo.findById.mockResolvedValue(
        leave({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: null }),
      );
      await service.approve(1, user(5, { codes: ['LEAVE:Approve'] }));
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'approved', decision_path: 'chain' }),
      );
    });

    it('lets pending_l2 → approved by the L2 approver', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l2', l2_approver_id: 7 }));
      await service.approve(1, user(7, { codes: ['LEAVE:Approve'] }));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'approved' }));
    });

    it('forbids a LEAVE:Approve holder who is not on the chain (403)', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1', l1_approver_id: 5 }));
      await expect(
        service.approve(1, user(99, { codes: ['LEAVE:Approve'] })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('lets an ApproveAny holder jump pending_l1 → approved via override (skips L2)', async () => {
      repo.findById.mockResolvedValue(
        leave({ status: 'pending_l1', l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await service.approve(1, user(42, { codes: ['LEAVE:Approve', 'LEAVE:ApproveAny'] }));
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'approved', decision_path: 'override' }),
      );
    });

    it('409 when the assigned approver is deactivated (chain path)', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1', l1_approver_id: 5 }));
      users.findById.mockResolvedValue(user(5, { is_active: false }));
      await expect(
        service.approve(1, user(5, { codes: ['LEAVE:Approve'] })),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('409 when approving a terminal request', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'approved' }));
      await expect(service.approve(1, user(5, { system_admin: true }))).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('reject', () => {
    it('requires a note', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1', l1_approver_id: 5 }));
      await expect(
        service.reject(1, user(5, { codes: ['LEAVE:Approve'] }), '  '),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('moves a pending request to rejected with the note', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1', l1_approver_id: 5 }));
      await service.reject(1, user(5, { codes: ['LEAVE:Approve'] }), 'No coverage');
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'rejected', decision_note: 'No coverage' }),
      );
    });
  });

  describe('cancel', () => {
    it('lets the requester cancel their own pending request', async () => {
      repo.findById.mockResolvedValue(leave({ employee_id: 12, status: 'pending_l1' }));
      await service.cancel(1, user(12));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'cancelled' }));
    });

    it('lets the requester cancel an approved request that has not yet elapsed', async () => {
      // New rule: active (pending OR approved) + not fully past → cancellable.
      repo.findById.mockResolvedValue(
        leave({ employee_id: 12, status: 'approved', end_date: '2026-06-05' }),
      );
      dayCount.today.mockReturnValue('2026-06-03'); // mid-leave, end_date >= today
      await service.cancel(1, user(12));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'cancelled' }));
    });

    it('forbids a stranger from cancelling', async () => {
      repo.findById.mockResolvedValue(leave({ employee_id: 12, status: 'pending_l1' }));
      await expect(service.cancel(1, user(99))).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('409 when cancelling a truly terminal request (rejected/cancelled)', async () => {
      repo.findById.mockResolvedValue(leave({ employee_id: 12, status: 'rejected' }));
      await expect(service.cancel(1, user(12))).rejects.toBeInstanceOf(ConflictException);
    });

    it('409 when cancelling an approved leave that has already elapsed', async () => {
      repo.findById.mockResolvedValue(
        leave({ employee_id: 12, status: 'approved', end_date: '2026-05-20' }),
      );
      dayCount.today.mockReturnValue('2026-06-01'); // end_date < today → past
      await expect(service.cancel(1, user(12))).rejects.toBeInstanceOf(ConflictException);
    });

    it('409 when cancelling a pending leave whose dates have already elapsed', async () => {
      repo.findById.mockResolvedValue(
        leave({ employee_id: 12, status: 'pending_l1', end_date: '2026-05-20' }),
      );
      dayCount.today.mockReturnValue('2026-06-01');
      await expect(service.cancel(1, user(12))).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('409 when editing a terminal request', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'approved' }));
      await expect(
        service.update(1, { reason: 'x' }, user(1, { codes: ['LEAVE:Update'] })),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('applies the patch to a pending request', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1' }));
      await service.update(1, { reason: 'typo fix' }, user(1, { codes: ['LEAVE:Update'] }));
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'typo fix' }));
    });

    it('does NOT recompute working_days on a reason-only edit', async () => {
      repo.findById.mockResolvedValue(leave({ status: 'pending_l1' }));
      await service.update(1, { reason: 'typo fix' }, user(1, { codes: ['LEAVE:Update'] }));
      expect(dayCount.assertSubmittableRange).not.toHaveBeenCalled();
    });

    it('recomputes working_days + window when edited to a half day', async () => {
      repo.findById.mockResolvedValue(
        leave({ status: 'pending_l1', employee_id: 12, leave_type: 'vacation', working_days: 5 }),
      );
      dayCount.assertSubmittableRange.mockResolvedValue({
        working_days: 0.5,
        start_time: '09:00:00',
        end_time: '14:00:00',
      });

      await service.update(
        1,
        { start_date: '2026-07-06', end_date: '2026-07-06', day_portion: 'first_half' },
        user(1, { codes: ['LEAVE:Update'] }),
      );

      expect(dayCount.assertSubmittableRange).toHaveBeenCalledWith(
        12,
        '2026-07-06',
        '2026-07-06',
        'first_half',
        'vacation',
      );
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          day_portion: 'first_half',
          working_days: 0.5,
          start_time: '09:00:00',
          end_time: '14:00:00',
        }),
      );
    });

    it('rejects editing a birthday request to a half day (422 via day-count)', async () => {
      repo.findById.mockResolvedValue(
        leave({ status: 'pending_l1', employee_id: 12, leave_type: 'birthday' }),
      );
      dayCount.assertSubmittableRange.mockRejectedValue(
        new UnprocessableEntityException({ status: 422, errors: { day_portion: 'whole day' } }),
      );
      await expect(
        service.update(1, { day_portion: 'first_half' }, user(1, { codes: ['LEAVE:Update'] })),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('findByIdForViewer', () => {
    it('allows the requester, an approver, and ViewAll; forbids others', async () => {
      repo.findById.mockResolvedValue(
        leave({ employee_id: 12, l1_approver_id: 5, l2_approver_id: 7 }),
      );
      await expect(service.findByIdForViewer(1, user(12))).resolves.toBeDefined();
      await expect(service.findByIdForViewer(1, user(5))).resolves.toBeDefined();
      await expect(
        service.findByIdForViewer(1, user(99, { codes: ['LEAVE:ViewAll'] })),
      ).resolves.toBeDefined();
      await expect(service.findByIdForViewer(1, user(99))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
