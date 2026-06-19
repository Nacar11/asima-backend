import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { ScheduleChangeIntent } from '@/work-schedules/domain/schedule-change';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { weekdayOf } from '@/utils/helpers/dates';
import {
  CorrectionLike,
  LeaveLike,
  breakChanged,
  classify,
  evaluateCorrection,
  evaluateLeave,
  governedDates,
  planVersioning,
  temporalClass,
  windowChanged,
} from '@/work-schedules/domain/cascade-policy';

function schedule(over: Partial<WorkSchedule> = {}): WorkSchedule {
  return {
    id: 88,
    employee_id: 12,
    day_of_week: 1,
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
    break_start: '12:00:00',
    effective_from: '2026-01-01',
    effective_to: null,
    created_by: 1,
    updated_by: null,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...over,
  } as WorkSchedule;
}

function modify(over: Partial<ScheduleChangeIntent> = {}): ScheduleChangeIntent {
  return {
    employee_id: 12,
    day_of_week: 1 as DayOfWeek,
    effective_from: '2026-06-24',
    mode: 'modify',
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
    break_start: '12:00:00',
    ...over,
  };
}

function leave(over: Partial<LeaveLike> = {}): LeaveLike {
  return {
    id: 1,
    employee_id: 12,
    start_date: '2026-07-01',
    end_date: '2026-07-01',
    day_portion: 'full',
    status: 'approved',
    leave_type: 'vacation',
    working_days: 1,
    ...over,
  };
}

function correction(over: Partial<CorrectionLike> = {}): CorrectionLike {
  return { id: 1, employee_id: 12, work_date: '2026-07-01', status: 'approved', ...over };
}

describe('planVersioning', () => {
  it('modify with no live row → create', () => {
    expect(planVersioning(null, modify())).toBe('create');
  });
  it('modify with a started live row → end_and_create', () => {
    expect(planVersioning(schedule({ effective_from: '2026-01-01' }), modify({ effective_from: '2026-06-24' }))).toBe(
      'end_and_create',
    );
  });
  it('C1: modify with an un-started live row (effective_from >= X) → replace', () => {
    expect(planVersioning(schedule({ effective_from: '2026-06-24' }), modify({ effective_from: '2026-06-24' }))).toBe(
      'replace',
    );
  });
  it('remove with a started live row → end_only', () => {
    expect(planVersioning(schedule({ effective_from: '2026-01-01' }), modify({ mode: 'remove', effective_from: '2026-06-24' }))).toBe(
      'end_only',
    );
  });
  it('C1: remove with an un-started live row → delete_only', () => {
    expect(planVersioning(schedule({ effective_from: '2026-06-30' }), modify({ mode: 'remove', effective_from: '2026-06-24' }))).toBe(
      'delete_only',
    );
  });
  it('remove with no live row → noop', () => {
    expect(planVersioning(null, modify({ mode: 'remove' }))).toBe('noop');
  });
});

describe('windowChanged / breakChanged', () => {
  it('unchanged window → false', () => {
    expect(windowChanged(schedule(), modify())).toBe(false);
  });
  it('changed in/out → true', () => {
    expect(windowChanged(schedule(), modify({ expected_in: '10:00:00' }))).toBe(true);
  });
  it('remove → window+break both changed', () => {
    expect(windowChanged(schedule(), modify({ mode: 'remove' }))).toBe(true);
    expect(breakChanged(schedule(), modify({ mode: 'remove' }))).toBe(true);
  });
  it('break length change only → breakChanged true, windowChanged false', () => {
    const intent = modify({ break_minutes: 30, break_start: '12:00:00' });
    expect(windowChanged(schedule(), intent)).toBe(false);
    expect(breakChanged(schedule(), intent)).toBe(true);
  });
});

describe('governedDates', () => {
  it('keeps only dates on weekday W and >= X', () => {
    const intent = modify({ day_of_week: weekdayOf('2026-07-01') as DayOfWeek, effective_from: '2026-06-24' });
    const dates = ['2026-06-10', '2026-07-01', '2026-07-08']; // 07-01 & 07-08 are same weekday
    const got = governedDates(dates, intent);
    expect(got).toContain('2026-07-01');
    expect(got).not.toContain('2026-06-10'); // before X (even if same weekday)
  });
});

describe('temporalClass', () => {
  const today = '2026-06-22';
  it('all dates before today → past', () => {
    expect(temporalClass(['2026-06-20'], today)).toBe('past');
  });
  it('all dates after today → future', () => {
    expect(temporalClass(['2026-06-30'], today)).toBe('future');
  });
  it('range spanning today → present', () => {
    expect(temporalClass(['2026-06-20', '2026-06-25'], today)).toBe('present');
  });
  it('exactly today → present', () => {
    expect(temporalClass([today], today)).toBe('present');
  });
});

describe('classify (the A.4 matrix)', () => {
  it('pending future → cancel', () => expect(classify('future', 'pending_l1')).toBe('cancel'));
  it('pending present → cancel', () => expect(classify('present', 'pending_l2')).toBe('cancel'));
  it('approved future → cancel', () => expect(classify('future', 'approved')).toBe('cancel'));
  it('approved present → keep', () => expect(classify('present', 'approved')).toBe('keep'));
  it('anything past → keep', () => expect(classify('past', 'pending_l1')).toBe('keep'));
});

describe('evaluateLeave', () => {
  const today = '2026-06-22';
  const futureW = weekdayOf('2026-07-01') as DayOfWeek;

  it('full-day future leave + removal → cancel', () => {
    const got = evaluateLeave(leave(), schedule(), modify({ mode: 'remove', day_of_week: futureW }), today);
    expect(got?.decision).toBe('cancel');
    expect(got?.trigger_dates).toEqual(['2026-07-01']);
  });
  it('full-day future leave + pure window change → not affected (null)', () => {
    const got = evaluateLeave(leave(), schedule(), modify({ day_of_week: futureW, expected_in: '10:00:00' }), today);
    expect(got).toBeNull();
  });
  it('half-day future leave + window change → cancel', () => {
    const got = evaluateLeave(
      leave({ day_portion: 'first_half', working_days: 0.5 }),
      schedule(),
      modify({ day_of_week: futureW, expected_in: '10:00:00' }),
      today,
    );
    expect(got?.decision).toBe('cancel');
  });
  it('half-day future leave + break-only change → cancel (snapshot stale)', () => {
    const got = evaluateLeave(
      leave({ day_portion: 'second_half', working_days: 0.5 }),
      schedule(),
      modify({ day_of_week: futureW, break_minutes: 30 }),
      today,
    );
    expect(got?.decision).toBe('cancel');
  });
  it('approved in-progress leave + removal → affected but KEPT', () => {
    // today inside the leave range; one governed date in the future tail
    const inProgress = leave({ start_date: '2026-06-20', end_date: '2026-06-29' });
    const W = weekdayOf('2026-06-27') as DayOfWeek;
    const got = evaluateLeave(inProgress, schedule(), modify({ mode: 'remove', day_of_week: W, effective_from: '2026-06-24' }), '2026-06-25');
    expect(got?.temporal).toBe('present');
    expect(got?.decision).toBe('keep');
  });
  it('pending future leave + removal → cancel', () => {
    const got = evaluateLeave(leave({ status: 'pending_l1' }), schedule(), modify({ mode: 'remove', day_of_week: futureW }), today);
    expect(got?.decision).toBe('cancel');
  });
  it('leave on a different weekday → null', () => {
    const otherW = ((futureW + 1) % 7) as DayOfWeek;
    expect(evaluateLeave(leave(), schedule(), modify({ mode: 'remove', day_of_week: otherW }), today)).toBeNull();
  });
});

describe('evaluateCorrection', () => {
  const today = '2026-06-22';
  const futureW = weekdayOf('2026-07-01') as DayOfWeek;

  it('future correction + window change → cancel', () => {
    const got = evaluateCorrection(correction(), schedule(), modify({ day_of_week: futureW, expected_out: '17:00:00' }), today);
    expect(got?.decision).toBe('cancel');
  });
  it('future correction + break-only change → not affected (null)', () => {
    const got = evaluateCorrection(correction(), schedule(), modify({ day_of_week: futureW, break_minutes: 30 }), today);
    expect(got).toBeNull();
  });
  it('correction + removal → cancel', () => {
    const got = evaluateCorrection(correction(), schedule(), modify({ mode: 'remove', day_of_week: futureW }), today);
    expect(got?.decision).toBe('cancel');
  });
  it('approved correction for today + window change → keep', () => {
    const W = weekdayOf('2026-06-22') as DayOfWeek;
    const got = evaluateCorrection(
      correction({ work_date: '2026-06-22' }),
      schedule(),
      modify({ day_of_week: W, effective_from: '2026-06-22', expected_in: '08:00:00' }),
      today,
    );
    expect(got?.temporal).toBe('present');
    expect(got?.decision).toBe('keep');
  });
});
