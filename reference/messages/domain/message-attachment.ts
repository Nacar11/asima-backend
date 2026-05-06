import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Message attachment domain model.
 *
 * Represents a file attachment in a message (image, document, etc.).
 *
 * @version 1
 * @since 1.0.0
 */
export class MessageAttachment {
  @ApiProperty({
    type: String,
    example: 'https://example.com/files/image.jpg',
    description: 'File URL',
  })
  file_url: string;

  @ApiProperty({
    type: String,
    example: 'image.jpg',
    description: 'File name',
  })
  file_name: string;

  @ApiProperty({
    type: String,
    example: 'image/jpeg',
    description: 'MIME type',
  })
  mime_type: string;

  @ApiProperty({
    type: Number,
    example: 1024000,
    description: 'File size in bytes',
  })
  file_size: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Photo of completed work',
    description: 'Optional caption or description',
  })
  caption?: string;
}
