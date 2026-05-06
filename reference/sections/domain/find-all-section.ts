import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class FindAllSection {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: '01',
  })
  section_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'SD1',
  })
  section_name: string;

  @Exclude()
  __entity?: string;
}
