import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_COMPLEXITY_MESSAGE, PASSWORD_COMPLEXITY_REGEX } from '@/users/users.constants';

/**
 * Admin force-reset of another user's password. No `current_password`
 * required — admin override. Logged via audit fields (`updated_by`).
 *
 * Self-service password change uses ChangeMyPasswordDto and DOES require
 * the caller's current password.
 */
export class ResetUserPasswordDto {
  @ApiProperty({ example: 'NewP@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  new_password!: string;
}
