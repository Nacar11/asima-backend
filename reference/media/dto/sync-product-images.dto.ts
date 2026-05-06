import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class SyncProductImagesDto {
  @ApiProperty({
    description: 'ID of the product',
    example: 50,
  })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    description: 'List of media IDs to set as the product gallery images',
    example: [101, 102, 103],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  media_ids: number[];
}
