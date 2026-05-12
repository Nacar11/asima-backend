import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_COMPLEXITY_MESSAGE, PASSWORD_COMPLEXITY_REGEX } from '@/users/users.constants';

/**
 * Self-service password change. Caller MUST provide the current password —
 * the service re-verifies it before hashing the new one. Defends against
 * session-hijack scenarios where the attacker has the access token but
 * not the password.
 *
 * Admin force-reset uses ResetUserPasswordDto and skips this check
 * (admin override).
 */
export class ChangeMyPasswordDto {
  @ApiProperty({ example: 'OldP@ssw0rd!' })
  @IsString()
  @MaxLength(128)
  current_password!: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  new_password!: string;
}
