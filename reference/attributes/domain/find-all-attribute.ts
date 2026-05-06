import { ApiProperty } from '@nestjs/swagger';
import { Attribute } from './attribute';

export class FindAllAttribute {
  @ApiProperty({ type: [Attribute] })
  data: Attribute[];

  @ApiProperty({ example: 10 })
  totalCount: number;

  @ApiProperty({ example: 0 })
  skip: number;

  @ApiProperty({ example: 40 })
  take: number;
}
