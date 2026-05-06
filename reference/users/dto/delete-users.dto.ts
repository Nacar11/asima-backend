import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BulkDeleteUserDto {
  @ApiProperty({
    type: String,
    required: true,
    description: `User IDs separated by commas`,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d+)(,\d+)*$/, {
    message: 'ids must only contain numbers separated by commas',
  })
  ids: string;
}
