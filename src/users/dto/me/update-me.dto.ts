import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Self-service profile update — narrow allowlist.
 *
 * Whitelisted fields ONLY: `first_name`, `last_name`. Anything else is
 * rejected by the global ValidationPipe (`forbidNonWhitelisted: true`)
 * because it isn't declared here. This is the seam that enforces "users
 * can update their own profile but not their role / activation / email."
 *
 * Privileged fields are intentionally absent:
 *  - `email` — admin-only (would change login identity, needs verification flow)
 *  - `role_id` — admin-only (privilege escalation)
 *  - `is_active` — admin-only (self-deactivation footgun)
 *  - `system_admin` — admin-only (privilege escalation)
 *  - `password` — separate endpoint with current-password re-verification
 *
 * Do NOT add admin-only fields here under any circumstance. Adding a field
 * to this DTO is the same security boundary change as adding a route.
 */
export class UpdateMeDto {
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
}
