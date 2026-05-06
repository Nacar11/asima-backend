import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncPrimaryImageDto {
  @ApiProperty({
    description: 'ID of the product',
    example: 50,
  })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    description: 'ID of the media file to set as the new primary image',
    example: 101,
  })
  @IsNumber()
  media_id: number;
}
