import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsNumber, IsOptional, Matches, Min } from 'class-validator';

/**
 * Admin-only payload for `POST /admin/compensation` — set / change pay.
 *
 * `hourly_rate` is optional: omit it to derive from `monthly_salary`, or
 * supply it to override the derivation. There is no `dto/me/*` create —
 * employees never set their own pay.
 */
export class CreateCompensationDto {
  @ApiProperty({ example: 12, description: 'Target employee (users.id) — NOT the actor.' })
  @IsInt()
  employee_id!: number;

  @ApiProperty({ example: 50000, minimum: 0, description: 'Monthly salary (up to 2 dp).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthly_salary!: number;

  @ApiPropertyOptional({
    example: 300,
    minimum: 0,
    nullable: true,
    description:
      'Override the derived hourly rate (up to 4 dp). Omit to derive from monthly_salary.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  hourly_rate?: number;

  @ApiProperty({
    example: '2026-06-01',
    description: 'YYYY-MM-DD, inclusive. Cannot be in the future.',
  })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_from must be YYYY-MM-DD' })
  effective_from!: string;
}
