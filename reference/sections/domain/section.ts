import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Exclude } from 'class-transformer';
import { StatusEnum } from '@/utils/enums/status-enum';
import { Causer } from '@/utils/domain/causer';

export class Section {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    nullable: false,
    example: '01',
  })
  section_code: string;

  @ApiProperty({
    type: String,
    nullable: false,
    example: 'SD1',
  })
  section_name: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  section_head: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty({
    type: String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  created_by: Causer;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
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
