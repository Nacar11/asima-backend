import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { PermissionEnum, StatusEnum } from '@/menus/menus.enum';

export class Menu {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'S001',
  })
  menu_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'Sales Order List',
  })
  menu_name: string;

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
