import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_COMPLEXITY_MESSAGE, PASSWORD_COMPLEXITY_REGEX } from '@/users/users.constants';

/**
 * Admin-only create payload.
 *
 * Carries the WIDE field set (`role_id`, `is_active`). The self-service
 * surface has no equivalent — by design, an employee cannot create a
 * user.
 *
 * `system_admin` is intentionally NOT exposed. The flag is reserved for
 * the seeded `admin@asima.inc` and any future ops/infra account, and is
 * created exclusively via `UserSeedService`. Exposing it on a public
 * API would turn a `USER:Create` permission into a route to
 * unconditional privilege bypass (it short-circuits `PermissionsGuard`).
 */
export class CreateUserDto {
  @ApiProperty({ example: 'jane.smith@asima.inc' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({ example: 'Senior HR Administrator' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string | null;

  @ApiProperty({ example: 2 })
  @IsInt()
  role_id!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
