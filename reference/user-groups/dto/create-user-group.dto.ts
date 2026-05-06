import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Length } from 'class-validator';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { UserPermission } from '@/user-permissions/domain/user-permission';
import { Menu } from '@/menus/domain/menu';

export class CreateUserGroupDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: () => String,
    required: true,
    example: 'Group1',
  })
  @IsString()
  @Length(2, 50)
  group_name: string;

  @ApiProperty({
    type: () => String,
    required: true,
    example: 'Group1 Description',
  })
  @IsString()
  @Length(2, 500)
  description: string;

  @ApiPropertyOptional({
    type: () => Array<UserAssignment>,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  members?: UserAssignment[];

  @ApiPropertyOptional({
    type: () => Array<UserPermission>,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  menus?: Menu[];
}
