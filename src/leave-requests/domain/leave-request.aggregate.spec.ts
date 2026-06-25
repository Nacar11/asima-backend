import { LeaveRequest, LeaveRequestProps } from '@/leave-requests/domain/leave-request.aggregate';
import { LeaveActor } from '@/leave-requests/domain/leave-actor';
import {
  LeaveRequestApproved,
  LeaveRequestAdvancedToL2,
  LeaveRequestCancelled,
  LeaveRequestRejected,
} from '@/leave-requests/domain/events/leave-request-events';
import {
  AttachmentContractError,
  LeaveStatusError,
  NotAllowedToCancelError,
  NotCurrentApproverError,
  RejectionNoteRequiredError,
} from '@/leave-requests/domain/leave-request-errors';

const EMPLOYEE = 12;
const L1 = 5;
const L2 = 7;

function makeProps(overrides: Partial<LeaveRequestProps> = {}): LeaveRequestProps {
  return {
    id: 1,
    employee_id: EMPLOYEE,
    leave_type: 'vacation',
    start_date: '2026-07-01',
    end_date: '2026-07-03',
    working_days: 3,
    day_portion: 'full',
    start_time: null,
    end_time: null,
    reason: null,
    status: 'pending_l1',
    submitted_at: new Date('2026-06-20T00:00:00Z'),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: L1,
    l2_approver_id: L2,
    attachment_id: null,
    created_by: EMPLOYEE,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-06-20T00:00:00Z'),
    updated_at: new Date('2026-06-20T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

const chainL1: LeaveActor = {
  user_id: L1,
  is_system_admin: false,
  can_approve: true,
  can_approve_any: false,
  can_delete: false,
};
const chainL2: LeaveActor = { ...chainL1, user_id: L2 };
const hrOverride: LeaveActor = {
  user_id: 99,
  is_system_admin: false,
  can_approve: false,
  can_approve_any: true,
  can_delete: true,
};
const stranger: LeaveActor = {
  user_id: 404,
  is_system_admin: false,
  can_approve: true,
  can_approve_any: false,
  can_delete: false,
};

describe('LeaveRequest aggregate — submit attachment contract', () => {
  it('requires an attachment for sick / bereavement', () => {
    expect(() => LeaveRequest.assertAttachmentContract('sick', false)).toThrow(
      AttachmentContractError,
    );
    expect(() => LeaveRequest.assertAttachmentContract('bereavement', false)).toThrow(
      AttachmentContractError,
    );
  });

  it('rejects an attachment on a type that does not accept one', () => {
    expect(() => LeaveRequest.assertAttachmentContract('vacation', true)).toThrow(
      AttachmentContractError,
    );
  });

  it('accepts sick WITH a file and vacation WITHOUT one', () => {
    expect(() => LeaveRequest.assertAttachmentContract('sick', true)).not.toThrow();
    expect(() => LeaveRequest.assertAttachmentContract('vacation', false)).not.toThrow();
  });
});

describe('LeaveRequest aggregate — reconstitution', () => {
  it('rebuilds from persisted state and exposes its fields', () => {
    const req = LeaveRequest.reconstitute(makeProps());
    expect(req.id).toBe(1);
    expect(req.status).toBe('pending_l1');
    expect(req.employee_id).toBe(EMPLOYEE);
    expect(req.pullEvents()).toEqual([]);
  });
});

describe('LeaveRequest aggregate — approve', () => {
  it('advances pending_l1 → pending_l2 when an L2 is snapshotted (chain path)', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    req.assertApprovable(chainL1);
    req.applyApproval(chainL1);

    expect(req.status).toBe('pending_l2');
    expect(req.decision_path).toBe('chain');
    expect(req.pullEvents().some((e) => e instanceof LeaveRequestAdvancedToL2)).toBe(true);
  });

  it('approves directly when the chain has no L2 (single step)', () => {
    const req = LeaveRequest.reconstitute(
      makeProps({ status: 'pending_l1', l2_approver_id: null }),
    );
    req.applyApproval(chainL1);

    expect(req.status).toBe('approved');
    expect(req.decided_by).toBe(L1);
    expect(req.pullEvents().some((e) => e instanceof LeaveRequestApproved)).toBe(true);
  });

  it('approves pending_l2 → approved on the L2 step', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l2' }));
    req.applyApproval(chainL2);
    expect(req.status).toBe('approved');
  });

  it('override (ApproveAny) jumps straight to approved and records decision_path=override', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    req.applyApproval(hrOverride);
    expect(req.status).toBe('approved');
    expect(req.decision_path).toBe('override');
  });

  it('rejects approval of a non-pending request', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'approved' }));
    expect(() => req.assertApprovable(chainL1)).toThrow(LeaveStatusError);
  });

  it('rejects approval by someone who is not the current-step approver', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    expect(() => req.assertApprovable(stranger)).toThrow(NotCurrentApproverError);
  });

  it('rejects a chain approver acting on the wrong step', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l2' }));
    expect(() => req.assertApprovable(chainL1)).toThrow(NotCurrentApproverError);
  });
});

describe('LeaveRequest aggregate — reject', () => {
  it('rejects a pending request with a note and records the event', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    req.reject(chainL1, 'insufficient coverage');

    expect(req.status).toBe('rejected');
    expect(req.decision_note).toBe('insufficient coverage');
    expect(req.pullEvents().some((e) => e instanceof LeaveRequestRejected)).toBe(true);
  });

  it('requires a non-empty note', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    expect(() => req.reject(chainL1, '   ')).toThrow(RejectionNoteRequiredError);
  });

  it('cannot reject a non-pending request', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'cancelled' }));
    expect(() => req.reject(chainL1, 'note')).toThrow(LeaveStatusError);
  });

  it('cannot be rejected by a non-approver', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    expect(() => req.reject(stranger, 'note')).toThrow(NotCurrentApproverError);
  });
});

describe('LeaveRequest aggregate — cancel', () => {
  const owner: LeaveActor = {
    user_id: EMPLOYEE,
    is_system_admin: false,
    can_approve: false,
    can_approve_any: false,
    can_delete: false,
  };
  const TODAY = '2026-06-25';

  it('owner cancels an active future request and records the event', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    req.cancel(owner, TODAY);

    expect(req.status).toBe('cancelled');
    expect(req.cancelled_by).toBe(EMPLOYEE);
    expect(req.pullEvents().some((e) => e instanceof LeaveRequestCancelled)).toBe(true);
  });

  it('HR (can_delete) may cancel on the employee’s behalf', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'approved' }));
    req.cancel(hrOverride, TODAY);
    expect(req.status).toBe('cancelled');
  });

  it('cannot cancel a terminal request', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'rejected' }));
    expect(() => req.cancel(owner, TODAY)).toThrow(LeaveStatusError);
  });

  it('cannot cancel a leave that has already ended', () => {
    const req = LeaveRequest.reconstitute(
      makeProps({ status: 'approved', start_date: '2026-06-01', end_date: '2026-06-10' }),
    );
    expect(() => req.cancel(owner, TODAY)).toThrow(LeaveStatusError);
  });

  it('a stranger cannot cancel', () => {
    const req = LeaveRequest.reconstitute(makeProps({ status: 'pending_l1' }));
    expect(() => req.cancel(stranger, TODAY)).toThrow(NotAllowedToCancelError);
  });
});
