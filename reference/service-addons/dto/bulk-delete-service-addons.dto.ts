import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDeleteServiceAddonsDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
