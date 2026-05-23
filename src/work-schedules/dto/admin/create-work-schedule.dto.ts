import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Admin-only create payload for `POST /admin/work-schedules`.
 *
 * Self-service users do NOT create schedules — that's an HR / manager
 * responsibility. Hence no `dto/me/create-*.dto.ts`.
 */
export class CreateWorkScheduleDto {
  @ApiProperty({ example: 12, description: 'Target employee (users.id) — NOT the actor.' })
  @IsInt()
  employee_id!: number;

  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: '0 = Sunday … 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week!: number;

  @ApiProperty({ example: '09:00:00', description: 'HH:MM or HH:MM:SS' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_in must be HH:MM or HH:MM:SS' })
  expected_in!: string;

  @ApiProperty({ example: '18:00:00', description: 'HH:MM or HH:MM:SS' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'expected_out must be HH:MM or HH:MM:SS' })
  expected_out!: string;

  @ApiProperty({ example: 60, minimum: 0 })
  @IsInt()
  @Min(0)
  break_minutes!: number;

  @ApiProperty({ example: '2026-05-23', description: 'YYYY-MM-DD, inclusive' })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_from must be YYYY-MM-DD' })
  effective_from!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description:
      'Optional close date. Omit / null for an active row. If set, the row is born already-ended.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_to must be YYYY-MM-DD' })
  effective_to?: string | null;
}
