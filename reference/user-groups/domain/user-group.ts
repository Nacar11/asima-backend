import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { Seller } from '@/sellers/domain/seller';
import { StatusEnum } from '@/user-groups/user-groups.enum';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { UserPermission } from '@/user-permissions/domain/user-permission';

export class UserGroup {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  seller_id?: number | null;

  @ApiProperty({
    type: () => Seller,
    nullable: true,
  })
  seller?: Seller | null;

  @ApiProperty({
    type: () => String,
  })
  group_name: string;

  @ApiProperty({
    type: () => String,
  })
  description: string;

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

  @ApiProperty({
    example: null,
  })
  user_assignments?: UserAssignment[] | null;

  @ApiProperty({
    example: null,
  })
  user_permissions?: UserPermission[] | null;

  @Exclude()
  __entity?: string;
}
