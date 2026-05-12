import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '@/permissions/domain/permission';

/**
 * Role domain class.
 *
 * A role is a named bundle of permissions. Users are assigned exactly one
 * role; their effective permissions = role.permissions.
 *
 * Pure TS — no @nestjs/* runtime or typeorm imports.
 *
 * Every field uses definite-assignment (`!`) — see the hexagonal rules
 * in `asima-backend/CLAUDE.md`. The mapper populates these; the
 * constructor never runs them.
 */
export class Role {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ADMIN' })
  name!: string;

  @ApiPropertyOptional({ example: 'Tenant administrators' })
  description!: string | null;

  @ApiProperty({ type: () => [Permission] })
  permissions!: Permission[];

  @ApiPropertyOptional({ example: 1, description: 'User id who created this row' })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 1, description: 'User id who last updated this row' })
  updated_by!: number | null;

  @ApiPropertyOptional({ example: null })
  deleted_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at!: Date | null;
}
