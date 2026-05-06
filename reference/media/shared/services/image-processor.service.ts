import { Injectable, Inject } from '@nestjs/common';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { StorageService } from '@/storage/storage.service';
import mediaFeatureFlagsConfig from '@/media/config/media-feature-flags.config';
import { ConfigType } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImageResult {
  metadata: ImageMetadata;
  thumbnail_path?: string;
  preview_path?: string;
  compressed_path?: string;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  size: number;
}

export interface ProcessedVideoResult {
  metadata: VideoMetadata;
  converted_buffer?: Buffer;
  converted_path?: string;
  thumbnail_path?: string;
  mime_type: string;
}

@Injectable()
export class ImageProcessorService {
  private readonly THUMBNAIL_SIZE = 300; // 300x300px
  private readonly PREVIEW_MAX_WIDTH = 1200; // Max width for preview
  private readonly COMPRESSED_QUALITY = 80; // JPEG quality for compressed version

  constructor(
    private readonly storageService: StorageService,
    @Inject(mediaFeatureFlagsConfig.KEY)
    private readonly featureFlags: ConfigType<typeof mediaFeatureFlagsConfig>,
  ) {}

  /**
   * Process an uploaded image:
   * 1. Extract metadata (width, height, format)
   * 2. Generate thumbnail (300x300px) if enabled
   * 3. Generate preview/compressed version (max 1200px width) if enabled
   */
  async processImage(
    fileBuffer: Buffer,
    basePath: string, // e.g., "media/sellers/store-name/images/originals/filename.jpg"
  ): Promise<ProcessedImageResult> {
    if (!this.featureFlags.enableImageProcessing) {
      console.log('Image processing is disabled. Skipping:', basePath);
      // Still extract metadata even if processing is disabled
      const metadata = await this.extractMetadata(fileBuffer);
      return { metadata };
    }

    // Extract metadata from original image
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to extract image dimensions');
    }

    const result: ProcessedImageResult = {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: fileBuffer.length,
      },
    };

    // Extract path components
    const pathParts = basePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const baseDir = pathParts.slice(0, -2).join('/'); // Remove "originals/filename"

    // Generate thumbnail (300x300px, cover fit)
    if (this.featureFlags.generateThumbnails) {
      try {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        const thumbnailPath = `${baseDir}/thumbnails/${filename}`;
        console.log('Uploading thumbnail to:', thumbnailPath);
        await this.storageService.putBuffer(thumbnailBuffer, thumbnailPath);
        result.thumbnail_path = thumbnailPath;
        console.log('Thumbnail uploaded successfully');
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        console.error(
          'Thumbnail path was:',
          `${baseDir}/thumbnails/${filename}`,
        );
      }
    }

    // Generate preview (max 1200px width, maintain aspect ratio)
    if (
      this.featureFlags.generateCompressed &&
      metadata.width > this.PREVIEW_MAX_WIDTH
    ) {
      try {
        const previewBuffer = await sharp(fileBuffer)
          .resize(this.PREVIEW_MAX_WIDTH, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        const previewPath = `${baseDir}/previews/${filename}`;
        await this.storageService.putBuffer(previewBuffer, previewPath);
        result.preview_path = previewPath;
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    }

    // Generate compressed version (same dimensions, lower quality)
    if (this.featureFlags.generateCompressed) {
      try {
        const compressedBuffer = await sharp(fileBuffer)
          .jpeg({ quality: this.COMPRESSED_QUALITY })
          .toBuffer();

        const compressedPath = `${baseDir}/compressed/${filename}`;
        await this.storageService.putBuffer(compressedBuffer, compressedPath);
        result.compressed_path = compressedPath;
      } catch (error) {
        console.error('Failed to generate compressed version:', error);
      }
    }

    return result;
  }

  /**
   * Extract only metadata without generating thumbnails
   */
  async extractMetadata(fileBuffer: Buffer): Promise<ImageMetadata> {
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to extract image dimensions');
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
      size: fileBuffer.length,
    };
  }

  /**
   * Process a video file:
   * 1. Convert to MP4 (H.264 + AAC) if not already MP4
   * 2. Extract metadata (width, height, duration)
   * 3. Generate thumbnail from first frame if enabled
   */
  async processVideo(
    fileBuffer: Buffer,
    originalPath: string, // e.g., "media/sellers/store-name/videos/originals/filename.mov"
  ): Promise<ProcessedVideoResult> {
    if (!this.featureFlags.enableVideoProcessing) {
      console.log('Video processing is disabled. Skipping:', originalPath);
      return {
        metadata: {
          width: 0,
          height: 0,
          duration: 0,
          format: 'unknown',
          size: fileBuffer.length,
        },
        mime_type: 'video/mp4',
      };
    }

    // Create temp files for processing
    const tempDir = os.tmpdir();
    const tempInputPath = path.join(
      tempDir,
      `input-${Date.now()}${path.extname(originalPath)}`,
    );
    const tempOutputPath = path.join(tempDir, `output-${Date.now()}.mp4`);

    try {
      // Write input buffer to temp file
      await fs.writeFile(tempInputPath, fileBuffer);

      // Extract metadata and convert to MP4
      const metadata = await this.extractVideoMetadata(tempInputPath);

      // Convert to MP4 (H.264 + AAC)
      const convertedBuffer = await this.convertToMp4(
        tempInputPath,
        tempOutputPath,
      );

      const result: ProcessedVideoResult = {
        metadata,
        converted_buffer: convertedBuffer,
        mime_type: 'video/mp4',
      };

      // Extract path components for thumbnail
      const pathParts = originalPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      const filenameWithoutExt = path.parse(filename).name;
      const baseDir = pathParts.slice(0, -2).join('/'); // Remove "originals/filename"

      // Generate video thumbnail (first frame)
      if (this.featureFlags.generateThumbnails) {
        try {
          const thumbnailBuffer =
            await this.generateVideoThumbnail(tempInputPath);
          const thumbnailPath = `${baseDir}/thumbnails/${filenameWithoutExt}.jpg`;
          console.log('Uploading video thumbnail to:', thumbnailPath);
          await this.storageService.putBuffer(thumbnailBuffer, thumbnailPath);
          result.thumbnail_path = thumbnailPath;
          console.log('Video thumbnail uploaded successfully');
        } catch (error) {
          console.error('Failed to generate video thumbnail:', error);
        }
      }

      return result;
    } finally {
      // Cleanup temp files
      try {
        await fs.unlink(tempInputPath);
        await fs.unlink(tempOutputPath);
      } catch (error) {
        console.error('Failed to cleanup temp files:', error);
      }
    }
  }

  /**
   * Extract video metadata using ffprobe
   */
  private extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );
        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        resolve({
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          duration: metadata.format.duration || 0,
          format: metadata.format.format_name || 'unknown',
          size: metadata.format.size || 0,
        });
      });
    });
  }

  /**
   * Convert video to MP4 (H.264 + AAC)
   */
  private convertToMp4(inputPath: string, outputPath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart', // Enable web streaming
        ])
        .on('start', (cmd) => {
          console.log('Starting video conversion:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`Converting: ${Math.round(progress.percent || 0)}%`);
        })
        .on('end', async () => {
          console.log('Video conversion completed');
          try {
            const buffer = await fs.readFile(outputPath);
            resolve(buffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Video conversion failed:', error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Generate thumbnail from video (first frame at 1 second)
   */
  private generateVideoThumbnail(videoPath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempThumbPath = path.join(os.tmpdir(), `thumb-${Date.now()}.jpg`);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['1'],
          filename: path.basename(tempThumbPath),
          folder: path.dirname(tempThumbPath),
          size: `${this.THUMBNAIL_SIZE}x${this.THUMBNAIL_SIZE}`,
        })
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(tempThumbPath);
            await fs.unlink(tempThumbPath);
            resolve(buffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
