import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { FILE_VERSIONS, FileVersion } from '@/storage/domain/file-version';

/**
 * `?version=` selector for the attachment download. Defaults to `original`.
 * `preview` / `thumbnail` exist only for image attachments (404 for PDFs).
 */
export class AttachmentVersionQueryDto {
  @ApiPropertyOptional({
    enum: Object.values(FILE_VERSIONS),
    default: FILE_VERSIONS.original,
  })
  @IsOptional()
  @IsIn(Object.values(FILE_VERSIONS))
  version: FileVersion = FILE_VERSIONS.original;
}
