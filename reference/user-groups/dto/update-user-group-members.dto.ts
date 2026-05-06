// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';

export class UpdateUserGroupMembersDto {
  @ApiPropertyOptional({
    type: () => Array<UserAssignment>,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  users?: UserAssignment['id'][];
}
