import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request.aggregate';
import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { CorrectionActor } from '@/time-correction-requests/domain/correction-actor';
import {
  CorrectionStatusError,
  InvalidProposedWindowError,
  NewLogContractError,
  NotAllowedToCancelError,
  NotCurrentApproverError,
  RejectionNoteRequiredError,
} from '@/time-correction-requests/domain/time-correction-request-errors';
import {
  TimeCorrectionAdvancedToL2,
  TimeCorrectionApproved,
  TimeCorrectionCancelled,
  TimeCorrectionRejected,
} from '@/time-correction-requests/domain/events/time-correction-request-events';
import { TimeCorrectionStatus } from '@/time-correction-requests/time-correction-requests.constants';

function makeRecord(
  overrides: Partial<TimeCorrectionRequestRecord> = {},
): TimeCorrectionRequestRecord {
  const base: TimeCorrectionRequestRecord = {
    id: 1,
    employee_id: 10,
    target_entry_id: 88,
    original_time_in: null,
    original_time_out: null,
    work_date: '2026-06-10',
    proposed_time_in: new Date('2026-06-10T09:00:00.000Z'),
    proposed_time_out: new Date('2026-06-10T17:00:00.000Z'),
    reason: 'Forgot to clock in',
    status: 'pending_l1',
    submitted_at: new Date('2026-06-10T08:00:00.000Z'),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: 7,
    created_by: 10,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-06-10T08:00:00.000Z'),
    updated_at: new Date('2026-06-10T08:00:00.000Z'),
    deleted_at: null,
  };
  return { ...base, ...overrides };
}

const chainApprover = (id: number): CorrectionActor => ({
  user_id: id,
  is_system_admin: false,
  can_approve: true,
  can_approve_any: false,
  can_delete: false,
});
const overrideActor = (id: number): CorrectionActor => ({
  user_id: id,
  is_system_admin: false,
  can_approve: false,
  can_approve_any: true,
  can_delete: false,
});
const plainUser = (id: number): CorrectionActor => ({
  user_id: id,
  is_system_admin: false,
  can_approve: false,
  can_approve_any: false,
  can_delete: false,
});

/** Run `fn`, returning the error it throws (fails loudly if it doesn't throw). */
function caught(fn: () => void): unknown {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error('Expected the call to throw, but it did not.');
}

describe('TimeCorrectionRequest aggregate', () => {
  describe('reconstitute', () => {
    it('rebuilds from a persisted record and exposes its state', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      expect(agg.id).toBe(1);
      expect(agg.employee_id).toBe(10);
      expect(agg.status).toBe('pending_l1');
      expect(agg.target_entry_id).toBe(88);
      expect(agg.work_date).toBe('2026-06-10');
      expect(agg.proposed_time_in).toEqual(new Date('2026-06-10T09:00:00.000Z'));
      expect(agg.proposed_time_out).toEqual(new Date('2026-06-10T17:00:00.000Z'));
    });

    it('throws on a corrupt row (proposed_time_out <= proposed_time_in)', () => {
      expect(() =>
        TimeCorrectionRequest.reconstitute(
          makeRecord({
            proposed_time_in: new Date('2026-06-10T17:00:00.000Z'),
            proposed_time_out: new Date('2026-06-10T09:00:00.000Z'),
          }),
        ),
      ).toThrow(InvalidProposedWindowError);
    });

    it('throws on an unknown status', () => {
      expect(() =>
        TimeCorrectionRequest.reconstitute(makeRecord({ status: 'bogus' as TimeCorrectionStatus })),
      ).toThrow();
    });
  });

  describe('applyApproval', () => {
    it('advances pending_l1 → pending_l2 when an L2 is snapshotted, recording AdvancedToL2', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ l2_approver_id: 7 }));
      agg.applyApproval(chainApprover(5));
      expect(agg.status).toBe('pending_l2');
      expect(agg.decided_by).toBe(5);
      expect(agg.decision_path).toBe('chain');
      const events = agg.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TimeCorrectionAdvancedToL2);
      expect((events[0] as TimeCorrectionAdvancedToL2).l2_approver_id).toBe(7);
    });

    it('approves directly when there is no L2 (single-step chain), recording Approved', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ l2_approver_id: null }));
      agg.applyApproval(chainApprover(5));
      expect(agg.status).toBe('approved');
      expect(agg.decision_path).toBe('chain');
      const events = agg.pullEvents();
      expect(events[0]).toBeInstanceOf(TimeCorrectionApproved);
    });

    it('approves pending_l2 → approved', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ status: 'pending_l2' }));
      agg.applyApproval(chainApprover(7));
      expect(agg.status).toBe('approved');
      expect(agg.pullEvents()[0]).toBeInstanceOf(TimeCorrectionApproved);
    });

    it('an override jumps pending_l1 straight to approved (decision_path override)', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ l2_approver_id: 7 }));
      agg.applyApproval(overrideActor(99));
      expect(agg.status).toBe('approved');
      expect(agg.decision_path).toBe('override');
      expect(agg.pullEvents()[0]).toBeInstanceOf(TimeCorrectionApproved);
    });
  });

  describe('assertApprovable', () => {
    it('passes for the current-step approver on a pending request', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      expect(() => agg.assertApprovable(chainApprover(5))).not.toThrow();
    });

    it('throws CorrectionStatusError when not pending', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ status: 'approved' }));
      expect(() => agg.assertApprovable(chainApprover(5))).toThrow(CorrectionStatusError);
    });

    it('throws NotCurrentApproverError when the caller is not the step approver', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      expect(() => agg.assertApprovable(chainApprover(999))).toThrow(NotCurrentApproverError);
    });
  });

  describe('reject', () => {
    it('rejects from pending with a note, recording Rejected', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      agg.reject(chainApprover(5), 'Insufficient evidence');
      expect(agg.status).toBe('rejected');
      expect(agg.decision_note).toBe('Insufficient evidence');
      expect(agg.pullEvents()[0]).toBeInstanceOf(TimeCorrectionRejected);
    });

    it('requires a non-empty note', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      expect(() => agg.reject(chainApprover(5), '   ')).toThrow(RejectionNoteRequiredError);
    });

    it('throws CorrectionStatusError when not pending', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ status: 'cancelled' }));
      expect(() => agg.reject(chainApprover(5), 'note')).toThrow(CorrectionStatusError);
    });

    it('throws NotCurrentApproverError for a non-approver', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord());
      expect(() => agg.reject(plainUser(123), 'note')).toThrow(NotCurrentApproverError);
    });
  });

  describe('cancel', () => {
    it('lets the owner cancel a pending request, recording Cancelled', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ employee_id: 10 }));
      agg.cancel(plainUser(10));
      expect(agg.status).toBe('cancelled');
      expect(agg.cancelled_by).toBe(10);
      expect(agg.pullEvents()[0]).toBeInstanceOf(TimeCorrectionCancelled);
    });

    it('lets an HR holder (can_delete) cancel on behalf', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ employee_id: 10 }));
      const hr: CorrectionActor = { ...plainUser(50), can_delete: true };
      agg.cancel(hr);
      expect(agg.status).toBe('cancelled');
    });

    it('throws NotAllowedToCancelError for a non-owner without HR rights', () => {
      const agg = TimeCorrectionRequest.reconstitute(makeRecord({ employee_id: 10 }));
      expect(() => agg.cancel(plainUser(999))).toThrow(NotAllowedToCancelError);
    });

    it('throws CorrectionStatusError when not pending (no not-elapsed rule — approved is NOT cancellable)', () => {
      const agg = TimeCorrectionRequest.reconstitute(
        makeRecord({ status: 'approved', employee_id: 10 }),
      );
      expect(() => agg.cancel(plainUser(10))).toThrow(CorrectionStatusError);
    });
  });

  describe('currentStepApproverId', () => {
    it('is the L1 approver while pending_l1', () => {
      expect(TimeCorrectionRequest.reconstitute(makeRecord()).currentStepApproverId()).toBe(5);
    });
    it('is the L2 approver while pending_l2', () => {
      expect(
        TimeCorrectionRequest.reconstitute(
          makeRecord({ status: 'pending_l2' }),
        ).currentStepApproverId(),
      ).toBe(7);
    });
    it('is null for a terminal state', () => {
      expect(
        TimeCorrectionRequest.reconstitute(
          makeRecord({ status: 'approved' }),
        ).currentStepApproverId(),
      ).toBeNull();
    });
  });

  describe('static assertProposedWindow', () => {
    const inAt = new Date('2026-06-10T09:00:00.000Z');
    it('passes when out is after in or null', () => {
      expect(() =>
        TimeCorrectionRequest.assertProposedWindow(inAt, new Date('2026-06-10T17:00:00.000Z')),
      ).not.toThrow();
      expect(() => TimeCorrectionRequest.assertProposedWindow(inAt, null)).not.toThrow();
    });
    it('throws InvalidProposedWindowError when out <= in', () => {
      expect(() => TimeCorrectionRequest.assertProposedWindow(inAt, new Date(inAt))).toThrow(
        InvalidProposedWindowError,
      );
    });
  });

  describe('static assertNewLogContract', () => {
    const today = '2026-06-10';
    it('is a no-op when targeting an existing entry (looser contract)', () => {
      expect(() =>
        TimeCorrectionRequest.assertNewLogContract({
          target_entry_id: 88,
          proposed_time_out: null,
          work_date: '2027-01-01',
          today,
        }),
      ).not.toThrow();
    });
    it('requires a time_out for a new log (field proposed_time_out)', () => {
      const err = caught(() =>
        TimeCorrectionRequest.assertNewLogContract({
          target_entry_id: null,
          proposed_time_out: null,
          work_date: today,
          today,
        }),
      );
      expect(err).toBeInstanceOf(NewLogContractError);
      expect((err as NewLogContractError).field).toBe('proposed_time_out');
    });
    it('rejects a future work_date for a new log (field work_date)', () => {
      const err = caught(() =>
        TimeCorrectionRequest.assertNewLogContract({
          target_entry_id: null,
          proposed_time_out: new Date('2026-06-11T17:00:00.000Z'),
          work_date: '2026-06-11',
          today,
        }),
      );
      expect(err).toBeInstanceOf(NewLogContractError);
      expect((err as NewLogContractError).field).toBe('work_date');
    });
    it('passes a valid same-or-past-day new log', () => {
      expect(() =>
        TimeCorrectionRequest.assertNewLogContract({
          target_entry_id: null,
          proposed_time_out: new Date('2026-06-10T17:00:00.000Z'),
          work_date: today,
          today,
        }),
      ).not.toThrow();
    });
  });
});
