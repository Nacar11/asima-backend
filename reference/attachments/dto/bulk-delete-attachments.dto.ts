import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BulkDeleteAttachmentsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d+)(,\d+)*$/, {
    message: 'ids must only contain numbers separated by commas',
  })
  ids: string;
}
