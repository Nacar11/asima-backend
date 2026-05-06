import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class FindAllDivision {
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
  division_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'CODY',
  })
  division_name: string;

  @Exclude()
  __entity?: string;
}
