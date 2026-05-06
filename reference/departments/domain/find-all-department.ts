import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class FindAllDepartment {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: '00',
  })
  department_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'Back Office',
  })
  department_name: string;

  @Exclude()
  __entity?: string;
}
