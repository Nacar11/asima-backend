import { EntityManager } from 'typeorm';
import { Compensation } from '@/compensation/domain/compensation';

/**
 * Port for compensation persistence. The service depends on this abstract
 * class; the concrete repository binds to it in `persistence.module.ts`.
 * Methods take an optional `EntityManager` so the service can run the
 * "end prior row + insert new row" pair inside one transaction.
 *
 * (Task 2 surface — read/lookup finders land with Task 3.)
 */
export abstract class BaseCompensationRepository {
  /**
   * The single active row for an employee (`effective_to IS NULL`), or
   * null. Because future-dating is disallowed, this IS the current rate.
   */
  abstract findActiveForEmployee(
    employee_id: number,
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
}
