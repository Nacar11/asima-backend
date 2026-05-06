import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Permission domain class.
 *
 * Represents a single capability the application can gate on, addressed
 * by a `RESOURCE:Action` code (e.g. `USER:Create`, `LEAVE:Approve`).
 *
 * Permissions are seed-managed configuration, sourced from
 * `src/database/seeds/data/permissions.json`. Roles reference permissions
 * via a many-to-many join table; users inherit them through their role.
 *
 * NOTE: This file must not import from `@nestjs/*` runtime packages or
 * `typeorm`. `@nestjs/swagger` is acceptable because it only provides
 * decorators that are stripped at runtime in domain classes.
 */
export class Permission {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'USER:Create' })
  code: string;

  @ApiProperty({ example: 'USER' })
  resource: string;

  @ApiProperty({ example: 'Create' })
  action: string;

  @ApiPropertyOptional({ example: 'Create new user accounts' })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at: Date;
}
