import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaSellersService } from './media-sellers.service';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { ProductMediaMappingRepository } from '@/media/persistence/repositories/product-media-mapping.repository';
import { StorageService } from '@/storage/storage.service';
import { Media } from '@/media/domain/media';
import { CreateMediaDto } from '@/media/dto/create-media.dto';
import { UpdateMediaDto } from '@/media/dto/update-media.dto';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { LinkMediaDto } from '@/media/dto/link-media.dto';
import { ReorderMediaDto } from '@/media/dto/reorder-media.dto';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { User } from '@/users/domain/user';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';

describe('MediaSellersService', () => {
  let service: MediaSellersService;
  let mediaRepository: MediaRepository;
  let mappingRepository: ProductMediaMappingRepository;
  let storageService: StorageService;
  let sellerRepository: BaseSellerRepository;

  const mockSeller = {
    id: 1,
    store_name: 'Test Store',
    user_id: 1,
  };

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    system_admin: false,
    seller: { id: 1 } as any,
  } as any;

  const mockMedia: Media = {
    id: 1,
    media_type: MediaTypeEnum.IMAGE,
    file_name: 'test-image.jpg',
    file_path: 'media/sellers/test-store/images/originals/test-image.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    width: 1920,
    height: 1080,
    processing_status: ProcessingStatusEnum.COMPLETED,
    seller_id: 1,
    status: StatusEnum.ACTIVE,
    alt_text: 'Test image',
    description: 'A test image',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: { id: 1, first_name: 'John', last_name: 'Doe' } as any,
    updated_by: { id: 1, first_name: 'John', last_name: 'Doe' } as any,
  };

  const mockMediaRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockSellerRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockMappingRepository = {
    create: jest.fn(),
    findByProductId: jest.fn(),
    findProductLevelMedia: jest.fn(),
    findOneById: jest.fn(),
    deleteById: jest.fn(),
    updateDisplayOrder: jest.fn(),
    unsetPrimaryForProduct: jest.fn(),
    unsetPrimaryAndMoveToGallery: jest.fn(),
    getMaxGalleryDisplayOrder: jest.fn(),
    getExistingGalleryMediaIds: jest.fn(),
    hasPrimaryImage: jest.fn(),
    updateSingleDisplayOrder: jest.fn(),
    setAsPrimary: jest.fn(),
    syncPrimaryImage: jest.fn(),
    syncProductImages: jest.fn(),
  };

  const mockStorageService = {
    put: jest.fn(),
    putBuffer: jest.fn(),
    get: jest.fn(),
    getFileBuffer: jest.fn(),
    delete: jest.fn(),
    getPresignedUrl: jest.fn(),
  };

  const mockImageProcessor = {
    processImage: jest.fn(),
    processVideo: jest.fn(),
    extractMetadata: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaSellersService,
        {
          provide: MediaRepository,
          useValue: mockMediaRepository,
        },
        {
          provide: ProductMediaMappingRepository,
          useValue: mockMappingRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: BaseSellerRepository,
          useValue: mockSellerRepository,
        },
        {
          provide: ImageProcessorService,
          useValue: mockImageProcessor,
        },
      ],
    }).compile();

    service = module.get<MediaSellersService>(MediaSellersService);
    mediaRepository = module.get<MediaRepository>(MediaRepository);
    mappingRepository = module.get<ProductMediaMappingRepository>(
      ProductMediaMappingRepository,
    );
    storageService = module.get<StorageService>(StorageService);
    sellerRepository = module.get<BaseSellerRepository>(BaseSellerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product media record', async () => {
      const createDto: CreateMediaDto = {
        media_type: MediaTypeEnum.IMAGE,
        file_name: 'test-image.jpg',
        file_path: 'media/images/originals/test-image.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
      };

      mockMediaRepository.create.mockResolvedValue(mockMedia);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMedia);
      expect(mediaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          processing_status: ProcessingStatusEnum.PENDING,
          status: StatusEnum.ACTIVE,
        }),
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload an image file and create media record', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const metadata = {
        alt_text: 'Test image',
        description: 'A test image',
        seller_id: 1,
      };

      const uploadResult = {
        url: 'https://example.com/media/sellers/test-store/images/originals/test-image.jpg',
        key: 'media/sellers/test-store/images/originals/test-image.jpg',
      };

      mockSellerRepository.findById.mockResolvedValue(mockSeller);
      mockStorageService.put.mockResolvedValue(uploadResult);
      mockImageProcessor.processImage.mockResolvedValue({
        metadata: { width: 1920, height: 1080 },
        thumbnail_path:
          'media/sellers/test-store/images/thumbnails/test-image.jpg',
        preview_path: 'media/sellers/test-store/images/previews/test-image.jpg',
        compressed_path:
          'media/sellers/test-store/images/compressed/test-image.jpg',
      });
      mockMediaRepository.create.mockResolvedValue(mockMedia);

      const result = await service.uploadFile(mockFile, metadata);

      expect(result).toEqual(mockMedia);
      expect(sellerRepository.findById).toHaveBeenCalledWith(1);
      expect(storageService.put).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('media/sellers/test-store/images/originals/'),
      );
      expect(mediaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: mockFile.originalname,
          file_path: uploadResult.key,
          file_size: mockFile.size,
          mime_type: mockFile.mimetype,
          media_type: MediaTypeEnum.IMAGE,
          alt_text: metadata.alt_text,
          description: metadata.description,
          seller_id: 1,
          processing_status: ProcessingStatusEnum.COMPLETED,
          status: StatusEnum.ACTIVE,
        }),
      );
    });

    it('should upload a video file to correct path', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 5024000,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const uploadResult = {
        url: 'https://example.com/media/sellers/test-store/videos/originals/test-video.mp4',
        key: 'media/sellers/test-store/videos/originals/test-video.mp4',
      };

      mockSellerRepository.findById.mockResolvedValue(mockSeller);
      mockStorageService.put.mockResolvedValue(uploadResult);
      mockImageProcessor.processVideo.mockResolvedValue({
        converted_buffer: Buffer.from('converted'),
        mime_type: 'video/mp4',
        metadata: {
          width: 1920,
          height: 1080,
          duration: 60,
        },
        thumbnail_path:
          'media/sellers/test-store/videos/thumbnails/test-video-thumb.jpg',
      });
      mockMediaRepository.create.mockResolvedValue({
        ...mockMedia,
        media_type: MediaTypeEnum.VIDEO,
      });

      await service.uploadFile(mockFile, { seller_id: 1 });

      expect(storageService.put).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('media/sellers/test-store/videos/originals/'),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated product media', async () => {
      const sellerId = 1;
      const query: GetMediaDto = {
        page: 1,
        limit: 10,
        sort: '-created_at',
      };

      const mockResponse = {
        data: [mockMedia],
        totalCount: 1,
      };

      mockMediaRepository.findAll.mockResolvedValue(mockResponse);

      const result = await service.findAll(sellerId, query);

      expect(result).toEqual(mockResponse);
      expect(mediaRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should search product media', async () => {
      const sellerId = 1;
      const query: GetMediaDto = {
        page: 1,
        limit: 10,
        sort: '-created_at',
        search: 'test search',
      };

      const mockResponse = {
        data: [mockMedia],
        totalCount: 1,
      };

      mockMediaRepository.findAll.mockResolvedValue(mockResponse);

      await service.findAll(sellerId, query);

      expect(mediaRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product media by ID', async () => {
      const sellerId = 1;
      const id = 1;

      mockMediaRepository.findById.mockResolvedValue(mockMedia);

      const result = await service.findOne(sellerId, id);

      expect(result).toEqual(mockMedia);
      expect(mediaRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if media not found', async () => {
      const sellerId = 1;
      const id = 999;

      mockMediaRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(sellerId, id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(sellerId, id)).rejects.toThrow(
        `Product media with ID ${id} not found`,
      );
    });
  });

  describe('update', () => {
    it('should update a product media record', async () => {
      const sellerId = 1;
      const id = 1;
      const updateDto: UpdateMediaDto = {
        alt_text: 'Updated alt text',
        description: 'Updated description',
        status: StatusEnum.ACTIVE,
      };

      const updatedMedia = { ...mockMedia, ...updateDto };
      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMediaRepository.update.mockResolvedValue(updatedMedia);

      const result = await service.update(sellerId, id, updateDto, mockUser);

      expect(result).toEqual(updatedMedia);
      expect(mediaRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should update media status to HOLD', async () => {
      const sellerId = 1;
      const id = 1;
      const updateDto: UpdateMediaDto = {
        status: StatusEnum.HOLD,
      };

      const updatedMedia = { ...mockMedia, status: StatusEnum.HOLD };
      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMediaRepository.update.mockResolvedValue(updatedMedia);

      const result = await service.update(sellerId, id, updateDto, mockUser);

      expect(result.status).toBe(StatusEnum.HOLD);
    });
  });

  describe('remove', () => {
    it('should soft delete a product media record', async () => {
      const sellerId = 1;
      const id = 1;

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMediaRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(sellerId, id);

      expect(mediaRepository.findById).toHaveBeenCalledWith(id);
      expect(mediaRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if media not found', async () => {
      const sellerId = 1;
      const id = 999;

      mockMediaRepository.findById.mockResolvedValue(null);

      await expect(service.remove(sellerId, id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('linkToProduct', () => {
    it('should link media to a product', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
        display_order: 0,
        is_primary: true,
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);

      await service.linkToProduct(sellerId, linkDto);

      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: linkDto.product_id,
          media_id: linkDto.media_ids[0],
          display_order: 0,
          is_primary: true,
        }),
      );
    });

    it('should use default values for optional fields (gallery case with existing primary)', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(true); // Primary exists

      await service.linkToProduct(sellerId, linkDto);

      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          display_order: 0, // -1 + 1 = 0
          is_primary: false,
        }),
      );
    });

    it('should auto-set first gallery image as primary when no primary exists', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1, 2],
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(false); // No primary exists

      await service.linkToProduct(sellerId, linkDto);

      // First image becomes primary
      expect(mappingRepository.create).toHaveBeenNthCalledWith(1, {
        product_id: 1,
        media_id: 1,
        display_order: 0,
        is_primary: true,
      });

      // Second image is gallery (display_order continues from startDisplayOrder + index)
      expect(mappingRepository.create).toHaveBeenNthCalledWith(2, {
        product_id: 1,
        media_id: 2,
        display_order: 1, // index 1 in the loop
        is_primary: false,
      });
    });

    it('should unset previous primary when setting new primary image', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
        is_primary: true,
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(0);
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(true);
      mockMappingRepository.unsetPrimaryAndMoveToGallery.mockResolvedValue(
        undefined,
      );
      mockMappingRepository.create.mockResolvedValue(undefined);

      await service.linkToProduct(sellerId, linkDto);

      expect(
        mappingRepository.unsetPrimaryAndMoveToGallery,
      ).toHaveBeenCalledWith(1, 1);
      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_primary: true,
        }),
      );
    });

    it('should not call unsetPrimaryForProduct when is_primary is false', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
        is_primary: false,
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(true);

      await service.linkToProduct(sellerId, linkDto);

      expect(mappingRepository.unsetPrimaryForProduct).not.toHaveBeenCalled();
    });

    it('should deduplicate and skip already-linked gallery media', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [2, 2, 1], // Duplicate 2, and 1 already in gallery
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(0);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([1]); // media_id 1 already in gallery
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(true);

      const result = await service.linkToProduct(sellerId, linkDto);

      // Only media_id 2 should be linked (deduplicated and 1 filtered out)
      expect(result.linked_count).toBe(1);
      expect(mappingRepository.create).toHaveBeenCalledTimes(1);
      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          media_id: 2,
        }),
      );
    });

    it('should return linked_count 0 when all gallery media already linked', async () => {
      const sellerId = 1;
      const linkDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1, 2],
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([
        1, 2,
      ]); // All already in gallery

      const result = await service.linkToProduct(sellerId, linkDto);

      expect(result.linked_count).toBe(0);
      expect(mappingRepository.create).not.toHaveBeenCalled();
    });

    it('should allow same media to be both primary and gallery', async () => {
      const sellerId = 1;
      // First set as primary
      const primaryDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
        is_primary: true,
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(false);
      mockMappingRepository.create.mockResolvedValue(undefined);

      await service.linkToProduct(sellerId, primaryDto);
      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ media_id: 1, is_primary: true }),
      );

      // Reset mocks
      jest.clearAllMocks();

      // Now add same media to gallery - should work since gallery check is separate
      const galleryDto: LinkMediaDto = {
        product_id: 1,
        media_ids: [1],
        is_primary: false,
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.create.mockResolvedValue(undefined);
      mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
      mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]); // Not in gallery yet
      mockMappingRepository.hasPrimaryImage.mockResolvedValue(true);

      const result = await service.linkToProduct(sellerId, galleryDto);

      expect(result.linked_count).toBe(1);
      expect(mappingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ media_id: 1, is_primary: false }),
      );
    });
  });

  describe('unlinkFromProduct', () => {
    it('should unlink media from a product', async () => {
      const sellerId = 1;
      const mappingId = 1;

      mockMappingRepository.findOneById.mockResolvedValue({
        id: mappingId,
        media: mockMedia,
      });
      mockMappingRepository.deleteById.mockResolvedValue(undefined);

      await service.unlinkFromProduct(sellerId, mappingId);

      expect(mappingRepository.findOneById).toHaveBeenCalledWith(mappingId);
      expect(mappingRepository.deleteById).toHaveBeenCalledWith(mappingId);
    });
  });

  describe('syncProductImages', () => {
    it('should sync product images (gallery only)', async () => {
      const sellerId = 1;
      const dto = {
        product_id: 1,
        media_ids: [1, 2, 2],
      };

      mockMediaRepository.findById.mockResolvedValue(mockMedia);
      mockMappingRepository.syncProductImages.mockResolvedValue(undefined);

      const result = await service.syncProductImages(sellerId, dto as any);

      expect(result.success).toBe(true);
      expect(mappingRepository.syncProductImages).toHaveBeenCalledWith(
        1,
        [1, 2],
      );
    });

    it('should allow empty media_ids to clear gallery', async () => {
      const sellerId = 1;
      const dto = {
        product_id: 1,
        media_ids: [],
      };

      mockMappingRepository.syncProductImages.mockResolvedValue(undefined);

      const result = await service.syncProductImages(sellerId, dto as any);

      expect(result.success).toBe(true);
      expect(mappingRepository.syncProductImages).toHaveBeenCalledWith(1, []);
    });

    it('should throw ForbiddenException when syncing media not owned by seller', async () => {
      const sellerId = 1;
      const dto = {
        product_id: 1,
        media_ids: [2],
      };

      mockMediaRepository.findById.mockResolvedValue({
        ...mockMedia,
        id: 2,
        seller_id: 999,
      });

      await expect(
        service.syncProductImages(sellerId, dto as any),
      ).rejects.toThrow();
    });
  });

  describe('getMedia', () => {
    it('should return all media for a product', async () => {
      const sellerId = 1;
      const productId = 1;
      const mockMappings = [
        {
          id: 1,
          product_id: productId,
          media_id: 1,
          display_order: 0,
          is_primary: true,

          media: mockMedia,
        },
      ];

      mockMappingRepository.findProductLevelMedia.mockResolvedValue(
        mockMappings,
      );

      const result = await service.getMedia(sellerId, productId);

      expect(result).toHaveLength(1);
      expect(result[0].media).toEqual(mockMedia);
      expect(result[0].is_primary).toBe(true);
      expect(result[0].display_order).toBe(0);
      expect(mappingRepository.findProductLevelMedia).toHaveBeenCalledWith(
        productId,
      );
    });

    it('should return empty array if no media found', async () => {
      const sellerId = 1;
      const productId = 999;

      mockMappingRepository.findProductLevelMedia.mockResolvedValue([]);

      const result = await service.getMedia(sellerId, productId);

      expect(result).toEqual([]);
    });

    it('should filter by is_primary when specified', async () => {
      const sellerId = 1;
      const productId = 1;
      const mockMappings = [
        {
          id: 1,
          product_id: productId,
          media_id: 1,
          display_order: 0,
          is_primary: true,

          media: mockMedia,
        },
        {
          id: 2,
          product_id: productId,
          media_id: 2,
          display_order: 1,
          is_primary: false,

          media: { ...mockMedia, id: 2 },
        },
      ];

      mockMappingRepository.findProductLevelMedia.mockResolvedValue(
        mockMappings,
      );

      const result = await service.getMedia(sellerId, productId, {
        isPrimary: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].media.id).toBe(1);
      expect(result[0].is_primary).toBe(true);
    });
  });

  describe('reorderMedia', () => {
    it('should reorder product media', async () => {
      const reorderDto: ReorderMediaDto = {
        product_id: 1,
        media_order: [
          { media_id: 1, display_order: 0 },
          { media_id: 2, display_order: 1 },
        ],
      };

      mockMappingRepository.updateDisplayOrder.mockResolvedValue(undefined);

      await service.reorderMedia(reorderDto);

      expect(mappingRepository.updateDisplayOrder).toHaveBeenCalledWith(
        reorderDto.product_id,
        reorderDto.media_order,
      );
    });
  });

  describe('Primary and Gallery Use Cases', () => {
    const sellerId = 1;
    const productId = 1;

    // Mock media for different use cases
    const primaryMedia = { ...mockMedia, id: 1 };
    const galleryMedia1 = { ...mockMedia, id: 2 };
    const galleryMedia2 = { ...mockMedia, id: 3 };
    const sharedMedia = { ...mockMedia, id: 5 };

    describe('Linking - Differentiation', () => {
      it('should create PRIMARY mapping with is_primary=true, variant_id=null, display_order=0', async () => {
        const dto: LinkMediaDto = {
          product_id: productId,
          media_ids: [1],
          is_primary: true,
        };

        mockMediaRepository.findById.mockResolvedValue(primaryMedia);
        mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
        mockMappingRepository.hasPrimaryImage.mockResolvedValue(false);
        mockMappingRepository.create.mockResolvedValue(undefined);

        await service.linkToProduct(sellerId, dto);

        expect(mappingRepository.create).toHaveBeenCalledWith({
          product_id: productId,
          media_id: 1,
          display_order: 0,
          is_primary: true,
        });
      });

      it('should create GALLERY mappings with is_primary=false when primary exists', async () => {
        const dto: LinkMediaDto = {
          product_id: productId,
          media_ids: [2, 3],
        };

        mockMediaRepository.findById.mockResolvedValue(galleryMedia1);
        mockMappingRepository.create.mockResolvedValue(undefined);
        mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(0);
        mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
        mockMappingRepository.hasPrimaryImage.mockResolvedValue(true); // Primary exists

        await service.linkToProduct(sellerId, dto);

        expect(mappingRepository.create).toHaveBeenNthCalledWith(1, {
          product_id: productId,
          media_id: 2,
          display_order: 1,
          is_primary: false,
        });

        expect(mappingRepository.create).toHaveBeenNthCalledWith(2, {
          product_id: productId,
          media_id: 3,
          display_order: 2,
          is_primary: false,
        });
      });

      it('should auto-set first gallery image as primary when no primary exists', async () => {
        const dto: LinkMediaDto = {
          product_id: productId,
          media_ids: [2, 3],
        };

        mockMediaRepository.findById.mockResolvedValue(galleryMedia1);
        mockMappingRepository.create.mockResolvedValue(undefined);
        mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
        mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
        mockMappingRepository.hasPrimaryImage.mockResolvedValue(false); // No primary

        await service.linkToProduct(sellerId, dto);

        // First image becomes primary
        expect(mappingRepository.create).toHaveBeenNthCalledWith(1, {
          product_id: productId,
          media_id: 2,
          display_order: 0,
          is_primary: true,
        });

        // Second image is gallery (display_order continues from startDisplayOrder + index)
        expect(mappingRepository.create).toHaveBeenNthCalledWith(2, {
          product_id: productId,
          media_id: 3,
          display_order: 1, // index 1 in the loop
          is_primary: false,
        });
      });

      it('should allow SAME media to be both PRIMARY and GALLERY', async () => {
        // First, link as primary
        const primaryDto: LinkMediaDto = {
          product_id: productId,
          media_ids: [5],
          is_primary: true,
        };

        mockMediaRepository.findById.mockResolvedValue(sharedMedia);
        mockMappingRepository.create.mockResolvedValue(undefined);

        await service.linkToProduct(sellerId, primaryDto);

        expect(mappingRepository.create).toHaveBeenCalledWith({
          product_id: productId,
          media_id: 5,
          display_order: 0,
          is_primary: true,
        });

        jest.clearAllMocks();

        // Then, link same media to gallery
        const galleryDto: LinkMediaDto = {
          product_id: productId,
          media_ids: [5],
        };

        mockMediaRepository.findById.mockResolvedValue(sharedMedia);
        mockMappingRepository.create.mockResolvedValue(undefined);
        mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(-1);
        mockMappingRepository.getExistingGalleryMediaIds.mockResolvedValue([]);
        mockMappingRepository.hasPrimaryImage.mockResolvedValue(true); // Primary now exists

        const result = await service.linkToProduct(sellerId, galleryDto);

        expect(result.linked_count).toBe(1);
        expect(mappingRepository.create).toHaveBeenCalledWith({
          product_id: productId,
          media_id: 5,
          display_order: 0,
          is_primary: false,
        });
      });
    });

    describe('Retrieval - Differentiation', () => {
      const allMappings = [
        // Primary image
        {
          id: 1,
          product_id: productId,
          media_id: 1,
          display_order: 0,
          is_primary: true,

          media: primaryMedia,
        },
        // Gallery images
        {
          id: 2,
          product_id: productId,
          media_id: 2,
          display_order: 1,
          is_primary: false,

          media: galleryMedia1,
        },
        {
          id: 3,
          product_id: productId,
          media_id: 3,
          display_order: 2,
          is_primary: false,

          media: galleryMedia2,
        },
      ];

      it('should retrieve ALL media when no filters applied', async () => {
        mockMappingRepository.findProductLevelMedia.mockResolvedValue(
          allMappings,
        );

        const result = await service.getMedia(sellerId, productId);

        expect(result).toHaveLength(3);
        expect(result[0].is_primary).toBe(true);
        expect(result[1].is_primary).toBe(false);
        expect(result[2].is_primary).toBe(false);
        expect(mappingRepository.findProductLevelMedia).toHaveBeenCalledWith(
          productId,
        );
      });

      it('should retrieve only PRIMARY image with is_primary=true filter', async () => {
        mockMappingRepository.findProductLevelMedia.mockResolvedValue(
          allMappings,
        );

        const result = await service.getMedia(sellerId, productId, {
          isPrimary: true,
        });

        expect(result).toHaveLength(1);
        expect(result[0].media.id).toBe(1);
        expect(result[0].is_primary).toBe(true);
      });

      it('should retrieve only GALLERY images with is_primary=false filter', async () => {
        mockMappingRepository.findProductLevelMedia.mockResolvedValue(
          allMappings,
        );

        const result = await service.getMedia(sellerId, productId, {
          isPrimary: false,
        });

        expect(result).toHaveLength(2);
        expect(result.map((m) => m.media.id)).toEqual([2, 3]);
        expect(result.every((m) => m.is_primary === false)).toBe(true);
      });
    });

    describe('Constraints - Single primary', () => {
      it('should call unsetPrimaryAndMoveToGallery when setting new primary', async () => {
        const dto: LinkMediaDto = {
          product_id: productId,
          media_ids: [1],
          is_primary: true,
        };

        mockMediaRepository.findById.mockResolvedValue(primaryMedia);
        mockMappingRepository.getMaxGalleryDisplayOrder.mockResolvedValue(0);
        mockMappingRepository.hasPrimaryImage.mockResolvedValue(true);
        mockMappingRepository.unsetPrimaryAndMoveToGallery.mockResolvedValue(
          undefined,
        );
        mockMappingRepository.create.mockResolvedValue(undefined);

        await service.linkToProduct(sellerId, dto);

        expect(
          mappingRepository.unsetPrimaryAndMoveToGallery,
        ).toHaveBeenCalledWith(productId, 1);
      });
    });
  });
});
