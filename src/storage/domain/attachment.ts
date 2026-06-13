import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentKind } from '@/storage/attachment.constants';

/**
 * Attachment domain class — a stored file's metadata. The bytes live in
 * object storage under `object_key_prefix`; this row is the registry +
 * the download access anchor (`owner_id`).
 *
 * Pure TS — no `@nestjs/*` runtime or `typeorm` imports (swagger
 * decorators are the allowed exception).
 */
export class Attachment {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'asima' })
  bucket!: string;

  @ApiProperty({
    example: 'leave-attachments/3f8c1e2a-1b2c-4d5e-9f01-2a3b4c5d6e7f',
    description: 'UUID-based object-key prefix; the version files live under it.',
  })
  object_key_prefix!: string;

  @ApiProperty({ example: 'medical-certificate.pdf' })
  original_filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  content_type!: string;

  @ApiProperty({ example: 24576 })
  size_bytes!: number;

  @ApiProperty({ example: 'pdf', enum: ['image', 'pdf'] })
  kind!: AttachmentKind;

  @ApiProperty({ example: false, description: 'true for images (preview + thumbnail exist)' })
  has_versions!: boolean;

  @ApiProperty({ example: 12, description: 'FK users.id — who uploaded; backs download access' })
  owner_id!: number;

  @ApiPropertyOptional({ example: 12, nullable: true })
  created_by!: number | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  updated_by!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_by!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deleted_at!: Date | null;
}
