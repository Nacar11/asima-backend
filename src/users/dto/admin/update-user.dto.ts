import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Admin-only update payload.
 *
 * Carries the WIDE field set: anything an admin is allowed to change about
 * another user — including `role_id` and `is_active`.
 *
 * Password changes do NOT ride here. Admin force-resets via the dedicated
 * `POST /admin/users/:id/reset-password` endpoint (ResetUserPasswordDto).
 * Keeping password out of the generic patch prevents accidental rotation.
 *
 * Nullable `title` is intentional — `null` clears it, omission leaves it.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'jane.smith@asima.inc' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

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
