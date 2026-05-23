import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

/**
 * Replaces a role's permission set entirely.
 *
 * Pass `[]` to clear all permissions. This is intentional — the operation
 * is a replace, not a delta. Frontend should always send the complete
 * desired set.
 */
export class AssignPermissionsDto {
  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permission_ids!: number[];
}
