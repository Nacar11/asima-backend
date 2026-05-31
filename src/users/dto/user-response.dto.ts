import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * Role identity shipped in user responses. Deliberately omits
 * `permissions` — the frontend sources UI gating from
 * `GET /api/v1/users/me/permissions` (a flat string array), never by
 * parsing `role.permissions` (parent CLAUDE.md). Embedding the full
 * permission tree on every user row also bloats list responses for no
 * consumer.
 */
export class UserRoleSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  name!: string;
}

/**
 * User wire shape with a slim role (no permissions tree). Mirrors the
 * `User` domain field-for-field, narrowing `role` to
 * `UserRoleSummaryDto`. Built via `UserResponseDto.from(user)` at the
 * controller boundary.
 *
 * This matches the shape the auth flow (`POST /auth/login`, `/auth/me`)
 * already returns — so every user-returning surface is consistent.
 */
export class UserResponseDto {
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

  @ApiProperty({ type: () => UserRoleSummaryDto })
  role!: UserRoleSummaryDto;

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

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    Object.assign(dto, user, {
      role: { id: user.role.id, name: user.role.name },
    });
    return dto;
  }
}
