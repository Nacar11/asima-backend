import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class FindAllSubSection {
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
  sub_section_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'Backend',
  })
  sub_section_name: string;

  @Exclude()
  __entity?: string;
}
