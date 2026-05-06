import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoProcessorService {
  /**
   * Process video: generate thumbnails, previews, transcoded versions
   * This service will be implemented when ENABLE_VIDEO_PROCESSING is enabled
   */
  processVideo(filePath: string): void {
    // TODO: Implement video processing with FFmpeg
    // - Generate thumbnails
    // - Generate preview images
    // - Transcode to different qualities (if needed)
    console.log('Video processing is disabled. Skipping:', filePath);
  }
}
