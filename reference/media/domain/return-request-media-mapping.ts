import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Media } from './media';

export class ReturnRequestMediaMapping {
  @ApiProperty({
    description: 'Mapping ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Return request ID',
    example: 1,
  })
  return_request_id: number;

  @ApiProperty({
    description: 'Media ID',
    example: 1,
  })
  media_id: number;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  display_order: number;

  @ApiPropertyOptional({
    description: 'User ID who created this mapping',
  })
  created_by?: number;

  @ApiPropertyOptional({
    description: 'Media details',
    type: () => Media,
  })
  media?: Media;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  created_at: Date;
}
