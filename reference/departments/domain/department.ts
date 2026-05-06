import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Exclude } from 'class-transformer';
import { StatusEnum } from '@/users/users.enum';
import { Causer } from '@/utils/domain/causer';

export class Department {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    nullable: false,
    example: '00',
  })
  department_code: string;

  @ApiProperty({
    type: String,
    nullable: false,
    example: 'Back Office',
  })
  department_name: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  department_head: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  >;

  @ApiProperty({
    type: String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe' },
  })
  created_by: Causer;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe' },
  })
  updated_by: Causer;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Causer | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
