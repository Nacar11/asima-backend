import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Media } from './media';

export class ProductMediaMapping {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  product_id: number;

  @ApiProperty({ type: Number, example: 1 })
  media_id: number;

  @ApiProperty({ type: Number, example: 0 })
  display_order: number;

  @ApiProperty({ type: Boolean, example: false })
  is_primary: boolean;

  @ApiPropertyOptional({ type: Number, example: 1 })
  created_by?: number;

  @ApiPropertyOptional({ type: Media })
  media?: Media;

  @ApiProperty({ type: Date })
  created_at: Date;
}
