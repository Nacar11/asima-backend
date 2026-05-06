import { StatusEnum } from '@/user-groups/user-groups.enum';
// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserGroupDto } from './create-user-group.dto';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';

export class UpdateUserGroupDto extends PartialType(CreateUserGroupDto) {
  @ApiPropertyOptional({
    type: () => String,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional({
    type: () => Array<UserAssignment>,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  members?: UserAssignment[];
}
