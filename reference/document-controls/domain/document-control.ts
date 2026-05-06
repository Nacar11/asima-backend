import { BaseMasterDomain } from '@/utils/domain/base-master.domain';
import { User } from '@/users/domain/user';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Menu } from '@/menus/domain/menu';

export class DocumentControl extends BaseMasterDomain {
  @ApiProperty({
    type: () => Menu,
  })
  menu: Menu;

  @ApiProperty({
    type: String,
    nullable: false,
    example: MasterStatusEnum.ACTIVE,
  })
  @Expose()
  status: MasterStatusEnum;

  @ApiProperty({
    type: String,
    nullable: false,
  })
  @Expose()
  prefix_pattern: string;

  @ApiProperty({
    type: Number,
    nullable: false,
    example: 1,
  })
  @Expose()
  last_series: number;

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
    nullable: true,
    example: null,
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
}
