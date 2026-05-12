import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * Role identity shipped in auth-flow responses. Deliberately omits
 * `permissions` — the frontend must source UI gating from
 * `GET /api/v1/users/me/permissions` (a flat string array), per the
 * parent CLAUDE.md. Embedding the full permission tree here would
 * invite client-side parsing of `role.permissions`, which is the path
 * the policy forbids.
 */
export class AuthRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  name!: string;
}

/**
 * User shape returned by auth-flow endpoints (`POST /auth/login`,
 * `GET /auth/me`). Mirrors the `User` domain class field-for-field with
 * one narrowing: `role` is `AuthRoleDto`, not the full `Role` (no
 * permissions tree). Built via `AuthUserDto.from(user)` at the
 * service/controller boundary.
 */
export class AuthUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'jane_smith@asima.inc' })
  email!: string;

  @ApiProperty({ example: 'Jane' })
  first_name!: string;

  @ApiProperty({ example: 'Smith' })
  last_name!: string;

  @ApiPropertyOptional({ example: 'Senior HR Administrator', nullable: true })
  title!: string | null;

  @ApiProperty({ type: () => AuthRoleDto })
  role!: AuthRoleDto;

  @ApiProperty({ example: 2 })
  role_id!: number;

  @ApiProperty({ example: false })
  system_admin!: boolean;

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  last_login_at!: Date | null;

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

  static from(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    Object.assign(dto, user, {
      role: { id: user.role.id, name: user.role.name },
    });
    return dto;
  }
}
