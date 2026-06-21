import { EntityManager } from 'typeorm';
import { Compensation } from '@/compensation/domain/compensation';
import { CompensationSearchCriteria } from '@/compensation/domain/compensation-search-criteria';
import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';

/**
 * Port for compensation persistence. The service depends on this abstract
 * class; the concrete repository binds to it in `persistence.module.ts`.
 * Methods take an optional `EntityManager` so the service can run the
 * "end prior row + insert new row" pair inside one transaction.
 */
export abstract class BaseCompensationRepository {
  /** Paginated list. `activeOnly` keeps one current row per employee. */
  abstract findAll(criteria: CompensationSearchCriteria): Promise<FindAllCompensation>;

  abstract findById(id: number): Promise<Compensation | null>;

  /** Full history for an employee, newest `effective_from` first. */
  abstract findHistoryForEmployee(employee_id: number): Promise<Compensation[]>;

  /**
   * The rate in effect on `date` (YYYY-MM-DD): the row where
   * `effective_from <= date AND (effective_to IS NULL OR effective_to >= date)`.
   * The OT-facing seam — null when the employee had no rate on that date.
   */
  abstract findRateOnDate(employee_id: number, date: string): Promise<Compensation | null>;

  /**
   * The single active row for an employee (`effective_to IS NULL`), or
   * null. Because future-dating is disallowed, this IS the current rate.
   */
  abstract findActiveForEmployee(
    employee_id: number,
    manager?: EntityManager,
  ): Promise<Compensation | null>;

  /**
   * The non-deleted row immediately preceding `before_effective_from`
   * (max `effective_from` strictly earlier). Used to reactivate the prior
   * row when the active row is deleted.
   */
  abstract findPreviousForEmployee(
    employee_id: number,
    before_effective_from: string,
    manager?: EntityManager,
  ): Promise<Compensation | null>;

  abstract create(
    input: {
      employee_id: number;
      monthly_salary: number;
      hourly_rate: number;
      hourly_rate_is_overridden: boolean;
      effective_from: string;
      effective_to?: string | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<Compensation>;

  abstract update(
    id: number,
    patch: {
      monthly_salary?: number;
      hourly_rate?: number;
      hourly_rate_is_overridden?: boolean;
      effective_from?: string;
      effective_to?: string | null;
      updated_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<Compensation>;

  abstract softDelete(
    id: number,
    deleted_by: number | null,
    manager?: EntityManager,
  ): Promise<void>;
}
