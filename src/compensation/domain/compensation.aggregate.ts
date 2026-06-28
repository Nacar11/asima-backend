import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { PayRate } from '@/compensation/domain/value-objects/pay-rate';
import { FutureEffectiveDateError } from '@/compensation/domain/compensation-errors';
import { CompensationRecord } from '@/compensation/domain/compensation';

/**
 * The full persisted shape of a compensation row — the reconstitution input. It
 * IS the persisted record, so alias it rather than duplicate the field list.
 */
export type CompensationProps = CompensationRecord;

/** The fields an admin correction may patch (the in-place `update` body). */
export interface CorrectionInput {
  monthly_salary?: number;
  hourly_rate?: number;
  effective_from?: string;
}

/**
 * The persist patch `correct` returns — handed verbatim to `repository.update`.
 * Mirrors the legacy service's `next` object exactly (incl. `updated_by`), so
 * the write is unchanged.
 */
export interface CorrectionPatch {
  monthly_salary?: number;
  hourly_rate?: number;
  hourly_rate_is_overridden?: boolean;
  effective_from?: string;
  updated_by: number | null;
}

/**
 * Compensation aggregate root. The pay rules that used to live as free
 * functions / inline branches in `CompensationService` are here: the
 * derivation+override rule on the `PayRate` value object, the future-date guard
 * as `assertNotFuture`, and the in-place correction as `correct`.
 *
 * Deliberately lighter than the approval modules: no actor, no authz on the
 * aggregate (admin routes are `@Permissions`-gated at the edge; `/me` is JWT
 * identity). The I/O-bound rules (one-active `23505`→409, the
 * `effective_from > prior` 422, the softDelete reactivation, and **every audit
 * write**) stay in the use-case — the audit is an inline transactional ledger,
 * not an event subscriber (decision #6).
 *
 * Extends `AggregateRoot` per the blueprint, but **records no domain events**:
 * the `compensation_audits` ledger already captures every write transactionally,
 * and nothing reads events yet (open question #1, resolved → skip). When an
 * OT-recompute / pay-notification consumer lands, `correct` (and the create
 * path) record events here — a non-breaking addition.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`.
 */
export class Compensation extends AggregateRoot {
  private _payRate: PayRate;
  private _effective_from: string;

  private constructor(private readonly p: CompensationProps) {
    super();
    // Building the PayRate VO validates — a corrupt row (negative salary/rate)
    // throws here on load rather than producing a silently-invalid aggregate.
    this._payRate = new PayRate(p.monthly_salary, p.hourly_rate, p.hourly_rate_is_overridden);
    this._effective_from = p.effective_from;
  }

  /** Rebuild the aggregate from a persisted record (validates the PayRate VO). */
  static reconstitute(props: CompensationProps): Compensation {
    return new Compensation(props);
  }

  /**
   * Reject a future-dated `effective_from`. Lexicographic comparison works for
   * zero-padded YYYY-MM-DD strings; `today` is fed by the use-case
   * (`businessDateString()`). Static because the create path calls it up-front,
   * before any DB work (single + bulk), with no aggregate instance in hand (I-1).
   */
  static assertNotFuture(effective_from: string, today: string): void {
    if (effective_from > today) {
      throw new FutureEffectiveDateError();
    }
  }

  // ── read accessors (what the use-case needs for the persist patch + audit) ──
  get id(): number {
    return this.p.id;
  }
  get employee_id(): number {
    return this.p.employee_id;
  }
  get monthly_salary(): number {
    return this._payRate.monthly_salary;
  }
  get hourly_rate(): number {
    return this._payRate.hourly_rate;
  }
  get hourly_rate_is_overridden(): boolean {
    return this._payRate.hourly_rate_is_overridden;
  }
  get effective_from(): string {
    return this._effective_from;
  }
  get effective_to(): string | null {
    return this.p.effective_to;
  }

  // ── behavior ──
  /**
   * Correct an erroneous row IN PLACE (no new history row). Re-derives the rate
   * only when a rate field is patched: a `monthly_salary` change re-derives
   * hourly and **clears** the override (the new salary is the fresh basis); an
   * explicit `hourly_rate` wins and sets the override; patching neither leaves
   * the rate untouched (S-1). Runs `assertNotFuture` when `effective_from` is
   * patched. Returns the persist patch the use-case writes — records no event
   * (the use-case appends the audit row transactionally, decision #6).
   */
  correct(patch: CorrectionInput, today: string, updated_by: number | null): CorrectionPatch {
    if (patch.effective_from !== undefined) {
      Compensation.assertNotFuture(patch.effective_from, today);
    }

    const next: CorrectionPatch = { updated_by };
    if (patch.monthly_salary !== undefined) next.monthly_salary = patch.monthly_salary;
    if (patch.effective_from !== undefined) next.effective_from = patch.effective_from;

    if (patch.hourly_rate !== undefined || patch.monthly_salary !== undefined) {
      const monthly = patch.monthly_salary ?? this._payRate.monthly_salary;
      const rate = PayRate.fromInput(monthly, patch.hourly_rate);
      next.hourly_rate = rate.hourly_rate;
      next.hourly_rate_is_overridden = rate.hourly_rate_is_overridden;
      this._payRate = rate;
    }

    if (patch.effective_from !== undefined) this._effective_from = patch.effective_from;

    return next;
  }
}
