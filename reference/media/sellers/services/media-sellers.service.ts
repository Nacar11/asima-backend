import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { ProductMediaMappingRepository } from '@/media/persistence/repositories/product-media-mapping.repository';
import { Media } from '@/media/domain/media';
import { CreateMediaDto } from '@/media/dto/create-media.dto';
import { UpdateMediaDto } from '@/media/dto/update-media.dto';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { LinkMediaDto } from '@/media/dto/link-media.dto';
import { UpdateMediaMappingDto } from '@/media/dto/update-media-mapping.dto';
import { ReorderMediaDto } from '@/media/dto/reorder-media.dto';
import { SyncPrimaryImageDto } from '@/media/dto/sync-primary-image.dto';
import { SyncProductImagesDto } from '@/media/dto/sync-product-images.dto';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StorageService } from '@/storage/storage.service';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';

@Injectable()
export class MediaSellersService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly mappingRepository: ProductMediaMappingRepository,
    private readonly storageService: StorageService,
    private readonly sellerRepository: BaseSellerRepository,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  async create(dto: CreateMediaDto): Promise<Media> {
    const media = new Media();
    Object.assign(media, dto);
    media.processing_status = ProcessingStatusEnum.PENDING;
    media.status = StatusEnum.ACTIVE;

    return this.mediaRepository.create(media);
  }

  /**
   * Create URL-friendly slug from store name
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Sanitize filename to be URL-safe
   */
  private sanitizeFilename(filename: string): string {
    // Extract extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name =
      lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    // Sanitize name: keep only alphanumeric, hyphens, underscores
    const sanitized = name
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces, hyphens, underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    return `${sanitized}${ext}`.toLowerCase();
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata: {
      title?: string;
      alt_text?: string;
      description?: string;
      seller_id: number;
    },
  ): Promise<Media> {
    // Fetch seller to get store name
    const seller = await this.sellerRepository.findById(metadata.seller_id);
    if (!seller) {
      throw new NotFoundException(
        `Seller with ID ${metadata.seller_id} not found`,
      );
    }

    // Create URL-friendly slug from store name
    const storeSlug = this.createSlug(seller.store_name);

    // Determine media type from mime type
    const mediaType = file.mimetype.startsWith('image')
      ? MediaTypeEnum.IMAGE
      : MediaTypeEnum.VIDEO;

    // Generate file path with timestamp and sanitized filename
    const timestamp = Date.now();
    const sanitizedName = this.sanitizeFilename(file.originalname);
    const fileName = `${timestamp}-${sanitizedName}`;
    const folderPath =
      mediaType === MediaTypeEnum.IMAGE
        ? `media/sellers/${storeSlug}/images/originals`
        : `media/sellers/${storeSlug}/videos/originals`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload to S3/MinIO (always public)
    const uploadResult = await this.storageService.put(file, filePath);

    // Create media record
    const media = new Media();
    media.file_name = file.originalname;
    media.file_path = uploadResult.key;
    media.file_size = file.size;
    media.mime_type = file.mimetype;
    media.media_type = mediaType;
    media.title = metadata.title;
    media.alt_text = metadata.alt_text;
    media.description = metadata.description;
    media.seller_id = metadata.seller_id;
    media.processing_status = ProcessingStatusEnum.PENDING;
    media.status = StatusEnum.ACTIVE;

    // Process image if it's an image type
    if (mediaType === MediaTypeEnum.IMAGE) {
      try {
        const processResult = await this.imageProcessor.processImage(
          file.buffer,
          uploadResult.key,
        );

        // Update metadata from processing
        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = processResult.preview_path;
        media.compressed_path = processResult.compressed_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (error) {
        console.error('Image processing failed:', error);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    } else {
      // Process video - convert to MP4 and extract metadata
      try {
        const processResult = await this.imageProcessor.processVideo(
          file.buffer,
          uploadResult.key,
        );

        // If video was converted, replace the original file
        if (processResult.converted_buffer) {
          // Update file path to .mp4 extension
          const mp4Path = uploadResult.key.replace(/\.[^.]+$/, '.mp4');

          // Upload converted MP4 with correct content type
          await this.storageService.putBuffer(
            processResult.converted_buffer,
            mp4Path,
            'video/mp4', // Set correct content type for MP4 videos
          );

          // Delete original non-MP4 file if different
          if (mp4Path !== uploadResult.key) {
            try {
              await this.storageService.delete(uploadResult.key);
            } catch (error) {
              console.error('Failed to delete original video file:', error);
            }
          }

          // Update media record with MP4 path and metadata
          media.file_path = mp4Path;
          media.file_name = file.originalname.replace(/\.[^.]+$/, '.mp4');
          media.mime_type = processResult.mime_type;
        }

        // Update metadata from processing
        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.duration = Math.round(processResult.metadata.duration); // Round to integer for DB
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = media.file_path;
        media.compressed_path = media.file_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (error) {
        console.error('Video processing failed:', error);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    }

    return this.mediaRepository.create(media);
  }

  /**
   * Create media from uploaded file for reviews
   */
  async createMediaFromFile(
    file: Express.Multer.File,
    userId: number,
    sellerId: number,
  ): Promise<Media> {
    return this.uploadFile(file, {
      title: `Review image - ${file.originalname}`,
      alt_text: `Review photo uploaded by user ${userId}`,
      description: 'Image uploaded with product review',
      seller_id: sellerId,
    });
  }

  async findAll(sellerId: number, query: GetMediaDto) {
    // Build base where conditions (always filter by seller_id)
    const baseConditions: string[] = [];
    baseConditions.push(`pm.seller_id = ${sellerId}`);
    baseConditions.push(`pm.file_path ILIKE 'media/sellers/%'`);

    // Add search filter if provided (searches across filename, title, alt_text, description)
    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim().replace(/'/g, "''"); // Escape single quotes
      const searchConditions = [
        `pm.file_name ILIKE '%${searchTerm}%'`,
        `pm.title ILIKE '%${searchTerm}%'`,
        `pm.alt_text ILIKE '%${searchTerm}%'`,
        `pm.description ILIKE '%${searchTerm}%'`,
      ];
      baseConditions.push(`(${searchConditions.join(' OR ')})`);
    }

    const finalWhere = baseConditions.join(' AND ');

    // Parse sort parameter (e.g., '-created_at' or 'file_name')
    const sortField = query.sort || '-created_at';
    const isDescending = sortField.startsWith('-');
    const fieldName = isDescending ? sortField.substring(1) : sortField;

    // Map field names to database columns
    const fieldMapping: Record<string, string> = {
      created_at: 'pm.created_at',
      updated_at: 'pm.updated_at',
      file_name: 'pm.file_name',
      title: 'pm.title',
      media_type: 'pm.media_type',
      file_size: 'pm.file_size',
    };

    const dbField = fieldMapping[fieldName] || 'pm.created_at';
    const sortDirection: 'DESC' | 'ASC' = isDescending ? 'DESC' : 'ASC';
    const orderBy = { [dbField]: sortDirection };

    // Calculate pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    return this.mediaRepository.findAll({
      where: finalWhere,
      skip,
      take: limit,
      orderBy,
    });
  }

  async findOne(sellerId: number, id: number): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith('media/sellers/')) {
      throw new NotFoundException(
        `Product media with ID ${id} not found for this seller`,
      );
    }

    // Check if media belongs to the requested seller
    if (media.seller_id !== sellerId) {
      throw new NotFoundException(
        `Product media with ID ${id} not found for this seller`,
      );
    }

    return media;
  }

  async update(
    sellerId: number,
    id: number,
    dto: UpdateMediaDto,
    currentUser: User,
    file?: Express.Multer.File,
  ): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith('media/sellers/')) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    // Only seller who owns the media can update it
    if (media.seller_id !== sellerId) {
      throw new ForbiddenException('You can only update media you own');
    }

    // If file is provided, replace the old file
    if (file) {
      // Fetch seller to get store name
      const seller = await this.sellerRepository.findById(sellerId);
      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found`);
      }

      // Create URL-friendly slug from store name
      const storeSlug = this.createSlug(seller.store_name);

      // Determine media type from mime type
      const mediaType = file.mimetype.startsWith('image')
        ? MediaTypeEnum.IMAGE
        : MediaTypeEnum.VIDEO;

      // Generate file path with timestamp and sanitized filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFilename(file.originalname);
      const fileName = `${timestamp}-${sanitizedName}`;
      const folderPath =
        mediaType === MediaTypeEnum.IMAGE
          ? `media/sellers/${storeSlug}/images/originals`
          : `media/sellers/${storeSlug}/videos/originals`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload new file to S3/MinIO
      const uploadResult = await this.storageService.put(file, filePath);

      // Delete old file from S3/MinIO
      if (media.file_path) {
        try {
          await this.storageService.delete(media.file_path);
        } catch (error) {
          console.error('Failed to delete old file:', error);
          // Continue even if deletion fails
        }
      }

      // Update file-related fields
      dto = {
        ...dto,
        file_name: file.originalname,
        file_path: uploadResult.key,
        file_size: file.size,
        mime_type: file.mimetype,
        media_type: mediaType,
        processing_status: ProcessingStatusEnum.PENDING,
      } as any;

      // Process image if it's an image type
      if (mediaType === MediaTypeEnum.IMAGE) {
        try {
          const processResult = await this.imageProcessor.processImage(
            file.buffer,
            uploadResult.key,
          );

          // Update metadata from processing
          dto = {
            ...dto,
            width: processResult.metadata.width,
            height: processResult.metadata.height,
            thumbnail_path: processResult.thumbnail_path,
            preview_path: processResult.preview_path,
            compressed_path: processResult.compressed_path,
            processing_status: ProcessingStatusEnum.COMPLETED,
          } as any;
        } catch (error) {
          console.error('Image processing failed:', error);
          dto = {
            ...dto,
            processing_status: ProcessingStatusEnum.FAILED,
          } as any;
        }
      } else {
        // For videos, mark as completed for now (video processing not implemented yet)
        dto = {
          ...dto,
          processing_status: ProcessingStatusEnum.COMPLETED,
        } as any;
      }
    }

    return this.mediaRepository.update(id, dto);
  }

  async remove(sellerId: number, id: number): Promise<void> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith('media/sellers/')) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    // Only seller who owns the media can delete it
    if (media.seller_id !== sellerId) {
      throw new ForbiddenException('You can only delete media you own');
    }

    await this.mediaRepository.softDelete(id);
  }

  /**
   * Link media files to a product.
   * Supports 2 use cases:
   * 1. Primary image: Set is_primary: true (only ONE per product, auto-replaces previous)
   * 2. Gallery images: Set is_primary: false or omit (multiple allowed)
   *
   * If no primary image exists and gallery images are being added,
   * the first gallery image will automatically become the primary.
   */
  async linkToProduct(
    sellerId: number,
    dto: LinkMediaDto,
  ): Promise<{ linked_count: number }> {
    // Verify all media exists and belongs to seller
    const notFoundMediaIds: number[] = [];
    const unauthorizedMediaIds: number[] = [];

    for (const mediaId of dto.media_ids) {
      const media = await this.mediaRepository.findById(mediaId);
      if (!media) {
        notFoundMediaIds.push(mediaId);
      } else if (media.seller_id !== sellerId) {
        // Security: Prevent linking media that doesn't belong to this seller
        unauthorizedMediaIds.push(mediaId);
      }
    }

    if (notFoundMediaIds.length > 0) {
      throw new NotFoundException(
        `Product media with IDs ${notFoundMediaIds.join(', ')} not found`,
      );
    }

    if (unauthorizedMediaIds.length > 0) {
      throw new ForbiddenException(
        `You can only link media you own. Unauthorized media IDs: ${unauthorizedMediaIds.join(', ')}`,
      );
    }

    const isPrimary = dto.is_primary ?? false;

    // For primary, only use first media_id
    // For gallery, deduplicate media_ids from input
    let mediaIdsToLink: number[];
    if (isPrimary) {
      mediaIdsToLink = [dto.media_ids[0]];
    } else {
      // Deduplicate input media_ids (preserve order, keep first occurrence)
      mediaIdsToLink = [...new Set(dto.media_ids)];
    }

    // If setting as primary, handle old primary (move to gallery with proper order)
    if (isPrimary) {
      // Get max gallery order before any changes
      const maxOrder = await this.mappingRepository.getMaxGalleryDisplayOrder(
        dto.product_id,
      );

      // Unset old primary and move it to end of gallery
      const hasPrimaryBefore = await this.mappingRepository.hasPrimaryImage(
        dto.product_id,
      );
      if (hasPrimaryBefore) {
        // Move old primary to gallery with next display_order
        await this.mappingRepository.unsetPrimaryAndMoveToGallery(
          dto.product_id,
          maxOrder + 1,
        );
      }
    }

    // For gallery images, filter out media already in gallery (but allow media that's primary)
    if (!isPrimary) {
      const existingGalleryMediaIds =
        await this.mappingRepository.getExistingGalleryMediaIds(dto.product_id);
      const existingSet = new Set(existingGalleryMediaIds);
      mediaIdsToLink = mediaIdsToLink.filter((id) => !existingSet.has(id));

      if (mediaIdsToLink.length === 0) {
        return { linked_count: 0 };
      }
    }

    // Check if product has a primary image
    const hasPrimary = await this.mappingRepository.hasPrimaryImage(
      dto.product_id,
    );

    // Calculate display_order for gallery images
    let startDisplayOrder = 0;
    if (!isPrimary) {
      const maxOrder = await this.mappingRepository.getMaxGalleryDisplayOrder(
        dto.product_id,
      );
      startDisplayOrder = dto.display_order ?? maxOrder + 1;
    }

    // Build mappings
    const mappings: Array<{
      product_id: number;
      media_id: number;
      display_order: number;
      is_primary: boolean;
    }> = [];

    // If this is a primary link, create primary mapping
    if (isPrimary) {
      mappings.push({
        product_id: dto.product_id,
        media_id: mediaIdsToLink[0],
        display_order: 0,
        is_primary: true,
      });
    } else {
      // Gallery images
      // If no primary exists, first gallery image becomes primary
      // When first becomes primary, gallery items should start from 1
      const galleryStartOrder = !hasPrimary ? 1 : startDisplayOrder;
      let galleryIndex = 0; // Track gallery position separately

      mediaIdsToLink.forEach((mediaId, index) => {
        const shouldBePrimary = !hasPrimary && index === 0;

        mappings.push({
          product_id: dto.product_id,
          media_id: mediaId,
          display_order: shouldBePrimary ? 0 : galleryStartOrder + galleryIndex,
          is_primary: shouldBePrimary,
        });

        // Only increment gallery index for non-primary items
        if (!shouldBePrimary) {
          galleryIndex++;
        }
      });
    }

    // Create all mappings
    await Promise.all(
      mappings.map((mapping) => this.mappingRepository.create(mapping as any)),
    );

    return { linked_count: mappings.length };
  }

  /**
   * Update a media mapping's display_order or is_primary status.
   * Supports two modes:
   * 1. Single update: Use media_id with display_order and/or is_primary
   * 2. Bulk reorder: Use media_ids array - order in array determines display_order
   */
  async updateMediaMapping(
    sellerId: number,
    dto: UpdateMediaMappingDto,
  ): Promise<{ success: boolean }> {
    // Bulk reorder mode: media_ids array provided
    if (dto.media_ids && dto.media_ids.length > 0) {
      // Update display_order for each media based on array position
      // Starting from 1 (primary has display_order 0)
      const mediaOrder = dto.media_ids.map((mediaId, index) => ({
        media_id: mediaId,
        display_order: index + 1,
      }));

      await this.mappingRepository.updateDisplayOrder(
        dto.product_id,
        mediaOrder,
      );

      return { success: true };
    }

    // Single update mode: media_id provided
    if (dto.media_id) {
      // If setting as primary
      if (dto.is_primary === true) {
        // Swap primary: old primary moves to gallery, new primary gets display_order 0
        await this.mappingRepository.swapPrimary(dto.product_id, dto.media_id);
      }

      // If updating display_order for a gallery image
      if (dto.display_order !== undefined) {
        await this.mappingRepository.updateSingleDisplayOrder(
          dto.product_id,
          dto.media_id,
          dto.display_order,
        );
      }
    }

    return { success: true };
  }

  async syncPrimaryImage(
    sellerId: number,
    dto: SyncPrimaryImageDto,
  ): Promise<{ success: boolean }> {
    const media = await this.mediaRepository.findById(dto.media_id);
    if (!media) {
      throw new NotFoundException(
        `Product media with ID ${dto.media_id} not found`,
      );
    }
    if (media.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only set a primary image using media you own',
      );
    }
    await this.mappingRepository.syncPrimaryImage(dto.product_id, dto.media_id);
    return { success: true };
  }

  async syncProductImages(
    sellerId: number,
    dto: SyncProductImagesDto,
  ): Promise<{ success: boolean }> {
    const uniqueMediaIds = Array.from(new Set(dto.media_ids));
    if (uniqueMediaIds.length > 0) {
      await Promise.all(
        uniqueMediaIds.map(async (mediaId) => {
          const media = await this.mediaRepository.findById(mediaId);
          if (!media) {
            throw new NotFoundException(
              `Product media with ID ${mediaId} not found`,
            );
          }
          if (media.seller_id !== sellerId) {
            throw new ForbiddenException(
              'You can only sync product images using media you own',
            );
          }
        }),
      );
    }
    await this.mappingRepository.syncProductImages(
      dto.product_id,
      uniqueMediaIds,
    );
    return { success: true };
  }

  async unlinkFromProduct(sellerId: number, mappingId: number): Promise<void> {
    const mapping = await this.mappingRepository.findOneById(mappingId);
    if (!mapping) {
      throw new NotFoundException(
        `Product media mapping with ID ${mappingId} not found`,
      );
    }
    if (!mapping.media || mapping.media.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only delete product media mappings that you own',
      );
    }
    await this.mappingRepository.deleteById(mappingId);
  }

  async getMedia(
    sellerId: number,
    productId: number,
    options?: {
      isPrimary?: boolean;
    },
  ): Promise<
    Array<{
      id: number;
      media: Media;
      is_primary: boolean;
      display_order: number;
    }>
  > {
    // Get all product-level media (primary + gallery)
    let mappings =
      await this.mappingRepository.findProductLevelMedia(productId);

    // Filter by is_primary if specified
    if (options?.isPrimary !== undefined) {
      mappings = mappings.filter((m) => m.is_primary === options.isPrimary);
    }

    // Sort mappings: primary first (is_primary=true), then by display_order ascending
    mappings.sort((a, b) => {
      // Primary images come first
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      // Then sort by display_order
      return a.display_order - b.display_order;
    });

    // Return mappings with media info (filter out null media)
    return mappings
      .filter((m) => m.media !== null && m.media !== undefined)
      .map((m) => ({
        id: m.id,
        media: m.media as Media,
        is_primary: m.is_primary,
        display_order: m.display_order,
      }));
  }

  async reorderMedia(dto: ReorderMediaDto): Promise<void> {
    // Verify product ownership would happen here when Product entity is implemented
    // For now, trust that seller_id validation at controller level is sufficient
    await this.mappingRepository.updateDisplayOrder(
      dto.product_id,
      dto.media_order,
    );
  }

  /**
   * Get media file URL with proper access control
   * Returns direct MinIO URL for public media access
   */
  async getMediaFileUrl(
    sellerId: number,
    id: number,
  ): Promise<{ url: string }> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith('media/sellers/')) {
      throw new NotFoundException(
        `Product media with ID ${id} not found for this seller`,
      );
    }

    // Return direct URL
    const directUrl = await this.storageService.get(media.file_path);
    if (typeof directUrl === 'object' && 'url' in directUrl) {
      return { url: directUrl.url };
    }

    throw new NotFoundException('Unable to generate access URL for this media');
  }
}
