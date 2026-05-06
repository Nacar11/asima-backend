import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class LinkGlobalCategoryMediaDto {
  @ApiProperty({
    type: Number,
    example: 123,
    description: 'Media ID to link to the global category',
  })
  @Type(() => Number)
  @IsInt()
  media_id: number;
}
