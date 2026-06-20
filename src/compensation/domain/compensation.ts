import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Employee-compensation domain class.
 *
 * One row = "this employee earns <monthly_salary> (and <hourly_rate> per
 * hour), effective from <effective_from> until <effective_to> (or
 * open-ended when effective_to is NULL)."
 *
 * The partial unique index
 *   (employee_id) WHERE effective_to IS NULL AND deleted_at IS NULL
 * enforces "at most one active row per employee". Because this foundation
 * disallows future-dating (`effective_from <= today`), the active row IS
 * the current rate — reads may use it directly. To change pay, the service
 * end-dates the active row and inserts a new one in one transaction; never
 * UPDATE the active row destructively (historical OT pay needs the rate
 * that was in effect at the time).
 *
 * Pure TS — no `@nestjs/*` runtime or `typeorm` imports. `@nestjs/swagger`
 * decorators are runtime-stripped, so allowed.
 */
export class Compensation {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12, description: 'FK to users.id (the employee, not the actor)' })
  employee_id!: number;

  @ApiProperty({ example: 50000, description: 'Canonical monthly salary (numeric(12,2)).' })
  monthly_salary!: number;

  @ApiProperty({
    example: 239.6128,
    description:
      'Hourly rate (numeric(12,4)). Derived from monthly_salary by default; HR may override.',
  })
  hourly_rate!: number;

  @ApiProperty({
    example: false,
    description: 'True when hourly_rate was set manually (diverged from the derivation).',
  })
  hourly_rate_is_overridden!: boolean;

  @ApiProperty({
    example: '2026-06-01',
    description: 'First calendar date this rate applies (inclusive, YYYY-MM-DD).',
  })
  effective_from!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'NULL while active. Setting this is the "logical end" — see class docs.',
  })
  effective_to!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updated_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at!: Date | null;
}
