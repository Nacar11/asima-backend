import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsOptional, Matches, Min } from 'class-validator';

/**
 * Admin-only payload for `PATCH /admin/compensation/:id` — correct an
 * erroneous row IN PLACE (no new history row). `employee_id` is not
 * writable. Supplying `hourly_rate` marks the row overridden; otherwise a
 * `monthly_salary` change recomputes the derived hourly rate.
 */
export class UpdateCompensationDto {
  @ApiPropertyOptional({ example: 55000, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthly_salary?: number;

  @ApiPropertyOptional({ example: 280, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_from must be YYYY-MM-DD' })
  effective_from?: string;
}
