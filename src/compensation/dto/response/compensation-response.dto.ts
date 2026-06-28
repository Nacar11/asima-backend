import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * HTTP response shape for a compensation row. This is the wire contract — it
 * carries the `@ApiProperty` Swagger metadata that used to live on the domain
 * class, keeping the domain pure (no `@nestjs/*`). Field names + order mirror
 * the persisted record exactly (snake_case end-to-end, incl. the non-column
 * `currency`), so the JSON is identical to the pre-DDD response. The e2e suite
 * guards byte-for-byte parity.
 */
export class CompensationResponseDto {
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
    example: 'PHP',
    description:
      'Company currency for these amounts. A single-tenant constant surfaced on reads ' +
      '(not a DB column); the mapper fills it from COMPENSATION_CURRENCY.',
  })
  currency!: string;

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
