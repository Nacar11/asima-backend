import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { Media } from '@/media/domain/media';
import { CreateMediaDto } from '@/media/dto/create-media.dto';
import { UpdateMediaDto } from '@/media/dto/update-media.dto';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StorageService } from '@/storage/storage.service';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';
import { BaseCategoryRepository } from '@/categories/persistence/base-category.repository';
import { Category } from '@/categories/domain/category';

@Injectable()
export class MediaAdminsService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly categoryRepository: BaseCategoryRepository,
  ) {}

  async create(dto: CreateMediaDto): Promise<Media> {
    const media: Media = new Media();
    Object.assign(media, dto);
    media.processing_status = ProcessingStatusEnum.PENDING;
    media.status = StatusEnum.ACTIVE;
    return this.mediaRepository.create(media);
  }

  private sanitizeFilename(filename: string): string {
    const lastDotIndex: number = filename.lastIndexOf('.');
    const name: string =
      lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext: string =
      lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    const sanitized: string = name
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${sanitized}${ext}`.toLowerCase();
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata: {
      title?: string;
      alt_text?: string;
      description?: string;
      admin_id: number;
    },
  ): Promise<Media> {
    const mediaType: MediaTypeEnum = file.mimetype.startsWith('image')
      ? MediaTypeEnum.IMAGE
      : MediaTypeEnum.VIDEO;
    const timestamp: number = Date.now();
    const sanitizedName: string = this.sanitizeFilename(file.originalname);
    const fileName: string = `${timestamp}-${sanitizedName}`;
    const folderPath: string =
      mediaType === MediaTypeEnum.IMAGE
        ? `media/admins/${metadata.admin_id}/images/originals`
        : `media/admins/${metadata.admin_id}/videos/originals`;
    const filePath: string = `${folderPath}/${fileName}`;

    const uploadResult: { key: string } = await this.storageService.put(
      file,
      filePath,
    );

    const media: Media = new Media();
    media.file_name = file.originalname;
    media.file_path = uploadResult.key;
    media.file_size = file.size;
    media.mime_type = file.mimetype;
    media.media_type = mediaType;
    media.title = metadata.title;
    media.alt_text = metadata.alt_text;
    media.description = metadata.description;
    media.processing_status = ProcessingStatusEnum.PENDING;
    media.status = StatusEnum.ACTIVE;

    if (mediaType === MediaTypeEnum.IMAGE) {
      try {
        const processResult = await this.imageProcessor.processImage(
          file.buffer,
          uploadResult.key,
        );
        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = processResult.preview_path;
        media.compressed_path = processResult.compressed_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (err) {
        console.error('Image processing failed:', err);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    } else {
      try {
        const processResult = await this.imageProcessor.processVideo(
          file.buffer,
          uploadResult.key,
        );
        if (processResult.converted_buffer) {
          const mp4Path: string = uploadResult.key.replace(/\.[^.]+$/, '.mp4');
          await this.storageService.putBuffer(
            processResult.converted_buffer,
            mp4Path,
            'video/mp4',
          );
          if (mp4Path !== uploadResult.key) {
            try {
              await this.storageService.delete(uploadResult.key);
            } catch (deleteErr) {
              console.error('Failed to delete original video file:', deleteErr);
            }
          }
          media.file_path = mp4Path;
          media.file_name = file.originalname.replace(/\.[^.]+$/, '.mp4');
          media.mime_type = processResult.mime_type;
        }
        media.width = processResult.metadata.width;
        media.height = processResult.metadata.height;
        media.duration = Math.round(processResult.metadata.duration);
        media.thumbnail_path = processResult.thumbnail_path;
        media.preview_path = media.file_path;
        media.compressed_path = media.file_path;
        media.processing_status = ProcessingStatusEnum.COMPLETED;
      } catch (err) {
        console.error('Video processing failed:', err);
        media.processing_status = ProcessingStatusEnum.FAILED;
      }
    }

    return this.mediaRepository.create(media);
  }

  async findAll(adminId: number, query: GetMediaDto) {
    const baseConditions: string[] = [];
    baseConditions.push(`pm.file_path ILIKE 'media/admins/${adminId}/%'`);

    if (query.search && query.search.trim()) {
      const searchTerm: string = query.search.trim().replace(/'/g, "''");
      const searchConditions: string[] = [
        `pm.file_name ILIKE '%${searchTerm}%'`,
        `pm.title ILIKE '%${searchTerm}%'`,
        `pm.alt_text ILIKE '%${searchTerm}%'`,
        `pm.description ILIKE '%${searchTerm}%'`,
      ];
      baseConditions.push(`(${searchConditions.join(' OR ')})`);
    }

    const finalWhere: string = baseConditions.join(' AND ');
    const sortField: string = query.sort || '-created_at';
    const isDescending: boolean = sortField.startsWith('-');
    const fieldName: string = isDescending ? sortField.substring(1) : sortField;

    const fieldMapping: Record<string, string> = {
      created_at: 'pm.created_at',
      updated_at: 'pm.updated_at',
      file_name: 'pm.file_name',
      title: 'pm.title',
      media_type: 'pm.media_type',
      file_size: 'pm.file_size',
    };

    const dbField: string = fieldMapping[fieldName] || 'pm.created_at';
    const sortDirection: 'DESC' | 'ASC' = isDescending ? 'DESC' : 'ASC';
    const orderBy: Record<string, 'DESC' | 'ASC'> = {
      [dbField]: sortDirection,
    };

    const page: number = query.page || 1;
    const limit: number = query.limit || 20;
    const skip: number = (page - 1) * limit;

    return this.mediaRepository.findAll({
      where: finalWhere,
      skip,
      take: limit,
      orderBy,
    });
  }

  async findOne(adminId: number, id: number): Promise<Media> {
    const media: Media | null = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith(`media/admins/${adminId}/`)) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    return media;
  }

  async update(
    adminId: number,
    id: number,
    dto: UpdateMediaDto,
    currentUser: User,
    file?: Express.Multer.File,
  ): Promise<Media> {
    const media: Media | null = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith(`media/admins/${adminId}/`)) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!currentUser.system_admin) {
      throw new ForbiddenException('You can only update media you own');
    }

    if (file) {
      const mediaType: MediaTypeEnum = file.mimetype.startsWith('image')
        ? MediaTypeEnum.IMAGE
        : MediaTypeEnum.VIDEO;
      const timestamp: number = Date.now();
      const sanitizedName: string = this.sanitizeFilename(file.originalname);
      const fileName: string = `${timestamp}-${sanitizedName}`;
      const folderPath: string =
        mediaType === MediaTypeEnum.IMAGE
          ? `media/admins/${adminId}/images/originals`
          : `media/admins/${adminId}/videos/originals`;
      const filePath: string = `${folderPath}/${fileName}`;

      const uploadResult: { key: string } = await this.storageService.put(
        file,
        filePath,
      );

      if (media.file_path) {
        try {
          await this.storageService.delete(media.file_path);
        } catch (err) {
          console.error('Failed to delete old file:', err);
        }
      }

      dto = {
        ...dto,
        file_name: file.originalname,
        file_path: uploadResult.key,
        file_size: file.size,
        mime_type: file.mimetype,
        media_type: mediaType,
        processing_status: ProcessingStatusEnum.PENDING,
      } as unknown as UpdateMediaDto;

      if (mediaType === MediaTypeEnum.IMAGE) {
        try {
          const processResult = await this.imageProcessor.processImage(
            file.buffer,
            uploadResult.key,
          );

          dto = {
            ...dto,
            width: processResult.metadata.width,
            height: processResult.metadata.height,
            thumbnail_path: processResult.thumbnail_path,
            preview_path: processResult.preview_path,
            compressed_path: processResult.compressed_path,
            processing_status: ProcessingStatusEnum.COMPLETED,
          } as unknown as UpdateMediaDto;
        } catch (err) {
          console.error('Image processing failed:', err);
          dto = {
            ...dto,
            processing_status: ProcessingStatusEnum.FAILED,
          } as unknown as UpdateMediaDto;
        }
      } else {
        dto = {
          ...dto,
          processing_status: ProcessingStatusEnum.COMPLETED,
        } as unknown as UpdateMediaDto;
      }
    }

    return this.mediaRepository.update(id, dto);
  }

  async remove(adminId: number, id: number, currentUser: User): Promise<void> {
    const media: Media | null = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith(`media/admins/${adminId}/`)) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!currentUser.system_admin) {
      throw new ForbiddenException('You can only delete media you own');
    }

    await this.mediaRepository.softDelete(id);
  }

  async linkToGlobalCategory(
    adminId: number,
    categoryId: number,
    mediaId: number,
    currentUser: User,
  ): Promise<Category> {
    if (!currentUser.system_admin) {
      throw new ForbiddenException(
        'You can only update global categories as a system admin',
      );
    }

    const category: Category | null =
      await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    if (category.seller_id !== null && category.seller_id !== undefined) {
      throw new ForbiddenException('You can only update global categories');
    }

    await this.findOne(adminId, mediaId);

    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, {
      media_id: mediaId,
      updated_by: currentUser.id,
    });
    return this.categoryRepository.update(categoryId, partialCategory);
  }

  async unlinkFromGlobalCategory(
    categoryId: number,
    currentUser: User,
  ): Promise<Category> {
    if (!currentUser.system_admin) {
      throw new ForbiddenException(
        'You can only update global categories as a system admin',
      );
    }

    const category: Category | null =
      await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    if (category.seller_id !== null && category.seller_id !== undefined) {
      throw new ForbiddenException('You can only update global categories');
    }

    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, {
      media_id: null,
      updated_by: currentUser.id,
    });
    return this.categoryRepository.update(categoryId, partialCategory);
  }

  async getMediaFileUrl(adminId: number, id: number): Promise<{ url: string }> {
    const media: Media | null = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    if (!media.file_path?.startsWith(`media/admins/${adminId}/`)) {
      throw new NotFoundException(`Product media with ID ${id} not found`);
    }

    const directUrl = await this.storageService.get(media.file_path);
    if (typeof directUrl === 'object' && 'url' in directUrl) {
      return { url: directUrl.url };
    }

    throw new NotFoundException('Unable to generate access URL for this media');
  }
}
