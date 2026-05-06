import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileUtils {
  private static readonly uploadDir = path.resolve(__dirname, '@/uploads');

  /**
   * Save a base64-encoded image buffer to the uploads directory.
   * @param base64Image The base64 string of the image.
  //  * @param originalName The original name of the image (used to determine extension).
   * @returns The relative file path for storage.
   */
  static async saveBase64Image(base64Image: string): Promise<string> {
    const matches = base64Image.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
    if (!matches) {
      throw new Error('Invalid base64 string');
    }

    const fileExtension = matches[1].split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Decode the base64 string into a buffer
    const buffer = Buffer.from(matches[2], 'base64');

    // Ensure the upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Save the file
    await fs.writeFile(filePath, buffer);

    return `src/uploads/${fileName}`;
  }
}
