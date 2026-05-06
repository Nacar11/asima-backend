import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMediaMappingDto {
  @ApiProperty({
    description: 'ID of the product',
    example: 50,
  })
  @IsNumber()
  product_id: number;

  @ApiPropertyOptional({
    description:
      'ID of the media file (for single update). Use either media_id OR media_ids, not both.',
    example: 101,
  })
  @ValidateIf((o) => !o.media_ids)
  @IsNumber()
  media_id?: number;

  @ApiPropertyOptional({
    description:
      'Array of media IDs for bulk reordering. The order in the array determines the display_order (first = 1, second = 2, etc.). Use either media_id OR media_ids, not both.',
    example: [3, 2, 1],
  })
  @ValidateIf((o) => !o.media_id)
  @IsArray()
  @IsNumber({}, { each: true })
  media_ids?: number[];

  @ApiPropertyOptional({
    description:
      'New display order for the media (only used with media_id, not media_ids).',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  display_order?: number;

  @ApiPropertyOptional({
    description:
      'Set as primary image. If true, this media becomes the primary and previous primary is unset. Only used with media_id. Defaults to false if not provided.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
