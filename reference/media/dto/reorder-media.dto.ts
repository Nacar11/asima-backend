import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MediaOrderItem {
  @ApiProperty({
    description: 'ID of the media file',
    example: 101,
  })
  @IsNumber()
  media_id: number;

  @ApiProperty({
    description: 'New display order position',
    example: 0,
  })
  @IsNumber()
  display_order: number;
}

export class ReorderMediaDto {
  @ApiProperty({
    description: 'ID of the product whose media is being reordered',
    example: 50,
  })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    description: 'Array of media items with their new display order',
    type: [MediaOrderItem],
    example: [
      { media_id: 102, display_order: 0 },
      { media_id: 101, display_order: 1 },
      { media_id: 103, display_order: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaOrderItem)
  media_order: MediaOrderItem[];
}
