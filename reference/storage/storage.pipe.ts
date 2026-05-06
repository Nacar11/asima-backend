import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class Base64ToMulterPipe implements PipeTransform {
  transform(value: any) {
    // If the value is already a Multer file or undefined, return as is
    if (!value || value.buffer) {
      return value;
    }

    try {
      let mimeType: string;
      let base64Data: string;

      // Check if it's a data URI format (data:image/jpeg;base64,...)
      const dataUriMatches = value.match(/^data:(.+);base64,(.+)$/);

      if (dataUriMatches) {
        // Data URI format: extract mime type and base64 data
        [, mimeType, base64Data] = dataUriMatches;
      } else {
        // Raw base64 string - detect mime type from content
        base64Data = value;
        mimeType = this.detectMimeType(base64Data);
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Validate buffer is not empty
      if (buffer.length === 0) {
        throw new BadRequestException('Invalid base64 string: empty content');
      }

      // Generate a filename with appropriate extension
      const extension = this.getExtensionFromMimeType(mimeType);
      const filename = `file-${Date.now()}-${Math.round(Math.random() * 1000)}${extension}`;

      // Create Multer file object
      const multerFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype: mimeType,
        buffer: buffer,
        size: buffer.length,
      } as Express.Multer.File;

      return multerFile;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error(error);
      throw new BadRequestException('Failed to process base64 file');
    }
  }

  /**
   * Detect MIME type from base64 content by checking magic bytes
   */
  private detectMimeType(base64Data: string): string {
    // Decode first 12 bytes to check magic bytes (need more for video detection)
    const header = Buffer.from(base64Data.substring(0, 24), 'base64');

    // JPEG: starts with FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: starts with 89 50 4E 47
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return 'image/png';
    }

    // GIF: starts with 47 49 46 38
    if (
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x38
    ) {
      return 'image/gif';
    }

    // WebP: starts with 52 49 46 46 ... 57 45 42 50
    if (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46
    ) {
      return 'image/webp';
    }

    // MP4/MOV: Check for ftyp box (starts at byte 4: 66 74 79 70 = "ftyp")
    // Format: [4 bytes size][4 bytes "ftyp"][brand...]
    if (
      header[4] === 0x66 &&
      header[5] === 0x74 &&
      header[6] === 0x79 &&
      header[7] === 0x70
    ) {
      // Check brand type (bytes 8-11)
      const brand = header.slice(8, 12).toString('ascii');
      // QuickTime brands: qt, mqt
      if (brand.startsWith('qt') || brand === 'mqt ') {
        return 'video/quicktime';
      }
      // MP4 brands: isom, iso2, mp41, mp42, M4V, etc.
      return 'video/mp4';
    }

    // Default to application/octet-stream for unknown types
    return 'application/octet-stream';
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };
    return mimeToExtension[mimeType] || '';
  }
}
