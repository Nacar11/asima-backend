import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Admin-only update payload.
 *
 * Carries the WIDE field set: anything an admin is allowed to change
 * about another user — including `role_id` and `is_active`.
 *
 * Intentionally absent:
 *
 *  - `email` — changing a login identity needs a verification flow
 *    (email confirmation round-trip). That flow doesn't exist yet, so
 *    the field is omitted entirely rather than left as a silent
 *    privilege. Admin can still set the email at create time. When the
 *    flow lands, re-introduce via a dedicated
 *    `PATCH /admin/users/:id/email` endpoint with its own DTO — NOT by
 *    adding a field back here.
 *  - `password` — admin force-resets via the dedicated
 *    `POST /admin/users/:id/reset-password` endpoint
 *    (`ResetUserPasswordDto`). Keeping password out of the generic
 *    patch prevents accidental rotation.
 *  - `system_admin` — same reasoning as `CreateUserDto`. Seed-managed
 *    only; exposing it would turn `USER:Update` into a permission
 *    escalation route.
 *
 * Nullable `title` is intentional — `null` clears it, omission leaves it.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'Senior HR Administrator', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  role_id?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
