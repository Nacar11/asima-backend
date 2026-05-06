import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkMediaDto {
  @ApiProperty({
    description: 'ID of the product to link media to',
    example: 50,
  })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    description: 'IDs of the media files to link',
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  media_ids: number[];

  @ApiPropertyOptional({
    description:
      'Starting display order for gallery images (lower numbers appear first). Only applies to gallery images (when is_primary=false). Auto-increments for multiple images. If omitted, continues from existing max display_order.',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  display_order?: number;

  @ApiPropertyOptional({
    description:
      'Whether this is the primary/featured image for the product. Only the first media_id will be used when is_primary=true. If no primary exists yet, the first gallery image will automatically become primary.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
