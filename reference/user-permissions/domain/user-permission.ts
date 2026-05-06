import { Menu } from '@/menus/domain/menu';
import { UserGroup } from './../../user-groups/domain/user-group';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import {
  PermissionEnum,
  StatusEnum,
} from '@/user-permissions/user-permissions.enum';

export class UserPermission {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: () => UserGroup,
    nullable: false,
    example: { id: 1, group_name: 'Group1', description: 'Group Description' },
  })
  group: Pick<UserGroup, 'id' | 'group_name' | 'description'>;

  @ApiProperty({
    type: () => Menu,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  menu: Pick<Menu, 'id' | 'menu_code' | 'menu_name' | 'permissions'>;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
    },
    example: [
      PermissionEnum.APPROVE,
      PermissionEnum.DELETE,
      PermissionEnum.EDIT,
      PermissionEnum.ENDORSE,
      PermissionEnum.REVIEW,
      PermissionEnum.UPLOAD,
      PermissionEnum.VIEW,
    ],
  })
  permissions: string[];

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  created_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  updated_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
