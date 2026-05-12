import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@/roles/domain/role';

/**
 * User domain class.
 *
 * Pure TS — no @nestjs/* runtime or typeorm imports. `@nestjs/swagger`
 * decorators are runtime-stripped, so they're allowed.
 *
 * IMPORTANT: this class never carries `password_hash`. The hash is loaded
 * separately via `BaseUserRepository.findByEmailWithCredentials()` (used
 * only by the auth login flow) and never leaves the persistence layer.
 */
export class User {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'jane_smith@asima.inc' })
  email!: string;

  @ApiProperty({ example: 'Jane' })
  first_name!: string;

  @ApiProperty({ example: 'Smith' })
  last_name!: string;

  @ApiPropertyOptional({
    example: 'Senior HR Administrator',
    description: 'Freeform display string. NEVER drives auth or routing — see ADR 0001.',
  })
  title!: string | null;

  @ApiProperty({ type: () => Role })
  role!: Role;

  @ApiProperty({ example: 2 })
  role_id!: number;

  @ApiProperty({ example: false, description: 'true short-circuits PermissionsGuard' })
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
}
