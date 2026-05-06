import { ApiProperty } from '@nestjs/swagger';

export class FindAllUser {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    type: String,
    example: null,
  })
  middle_name: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  last_name: string;

  @ApiProperty({
    type: String,
    example: null,
  })
  suffix: string | null;
}
