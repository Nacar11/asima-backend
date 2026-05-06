import { NotFoundException } from '@nestjs/common';
import { FileTypeEnum } from '@/attachments/attachments.enum';

export function getFileTypeFromURL(url: string): string | null {
  try {
    const urlParts = url.split('.');
    const extension = urlParts[urlParts.length - 1];

    if (!extension) {
      console.warn(`Unable to determine file type for URL: ${url}`);
      return null;
    }

    return extension;
  } catch (error) {
    throw new NotFoundException(
      `Failed to fetch file from Attachment URL provided: ${error.message}`,
    );
  }
}

export const mimeToFileTypeMap: Record<string, FileTypeEnum> = {
  pdf: FileTypeEnum.PDF,
  jpeg: FileTypeEnum.JPEG,
  jpg: FileTypeEnum.JPG,
  png: FileTypeEnum.PNG,
  document: FileTypeEnum.DOCX,
  xlsx: FileTypeEnum.XLSX,
  csv: FileTypeEnum.CSV,
  plain: FileTypeEnum.TXT,
  mp4: FileTypeEnum.MP4,
  mpeg: FileTypeEnum.MP3,
  zip: FileTypeEnum.ZIP,
  'x-rar-compressed': FileTypeEnum.RAR,
};
