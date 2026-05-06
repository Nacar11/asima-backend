import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaTypeEnum } from './media-type.enum';
import { ProcessingStatusEnum } from './processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { Exclude } from 'class-transformer';

export class Media {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ type: Number })
  created_by?: number;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: Number })
  updated_by?: number;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: Number })
  deleted_by?: number;

  @ApiPropertyOptional()
  deleted_at?: Date;

  @Exclude()
  __entity?: string;
  @ApiProperty({
    enum: MediaTypeEnum,
  })
  media_type: MediaTypeEnum;

  @ApiProperty({
    type: String,
  })
  file_name: string;

  @ApiProperty({
    type: String,
  })
  file_path: string;

  @ApiProperty({
    type: Number,
  })
  file_size: number;

  @ApiProperty({
    type: String,
  })
  mime_type: string;

  @ApiPropertyOptional({
    type: Number,
  })
  width?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  height?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  duration?: number;

  @ApiPropertyOptional({
    type: String,
  })
  thumbnail_path?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Full URL to thumbnail image',
  })
  thumbnail_url?: string;

  @ApiPropertyOptional({
    type: String,
  })
  preview_path?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Full URL to preview image',
  })
  preview_url?: string;

  @ApiPropertyOptional({
    type: String,
  })
  compressed_path?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Full URL to compressed image',
  })
  compressed_url?: string;

  @ApiPropertyOptional({
    type: String,
  })
  watermarked_path?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Full URL to watermarked image',
  })
  watermarked_url?: string;

  @ApiProperty({
    enum: ProcessingStatusEnum,
  })
  processing_status: ProcessingStatusEnum;

  @ApiPropertyOptional({
    type: String,
  })
  processing_error?: string;

  @ApiPropertyOptional({
    type: String,
  })
  title?: string;

  @ApiPropertyOptional({
    type: String,
  })
  alt_text?: string;

  @ApiPropertyOptional({
    type: String,
  })
  description?: string;

  @ApiPropertyOptional({
    type: Number,
  })
  seller_id?: number;

  @ApiProperty({
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'URL to view/download the media file with access control',
  })
  url?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Alias of url (legacy field expected by some clients)',
  })
  file_url?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Alias of mime_type (legacy field expected by some clients)',
  })
  file_type?: string;
}
