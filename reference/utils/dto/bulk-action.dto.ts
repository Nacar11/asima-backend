import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class BulkActionDto {
  @ApiProperty({
    example: [1, 2],
    description: 'List of IDs to perform the bulk action on',
  })
  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}
