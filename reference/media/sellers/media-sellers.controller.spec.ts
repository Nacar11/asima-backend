import { Test, TestingModule } from '@nestjs/testing';
import { MediaSellersController } from './media-sellers.controller';
import { MediaSellersService } from './services/media-sellers.service';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { LinkMediaDto } from '@/media/dto/link-media.dto';
import { ReorderMediaDto } from '@/media/dto/reorder-media.dto';
import { Media } from '@/media/domain/media';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('MediaSellersController', () => {
  let controller: MediaSellersController;
  let service: MediaSellersService;

  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    system_admin: false,
    seller_id: 1,
    seller: { id: 1 },
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

  const mockMediaService = {
    create: jest.fn(),
    uploadFile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    linkToProduct: jest.fn(),
    unlinkFromProduct: jest.fn(),
    getMedia: jest.fn(),
    reorderMedia: jest.fn(),
    syncPrimaryImage: jest.fn(),
    syncProductImages: jest.fn(),
  };

  beforeEach(async () => {
    const AuthGuardMock = {
      canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { id: 1, username: 'test-user' };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaSellersController],
      providers: [
        {
          provide: MediaSellersService,
          useValue: mockMediaService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MediaSellersController>(MediaSellersController);
    service = module.get<MediaSellersService>(MediaSellersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload files and create media records', async () => {
      const sellerId = 1;
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'test-image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024000,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const metadata = {
        alt_text: 'Test image',
        description: 'A test image',
      };

      mockMediaService.uploadFile.mockResolvedValue(mockMedia);

      const result = await controller.uploadFile(
        sellerId,
        mockFiles,
        mockUser,
        metadata.alt_text,
        metadata.description,
      );

      expect(result).toBeDefined();
      expect(service.uploadFile).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all product media', async () => {
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

      mockMediaService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(sellerId, query);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single product media by ID', async () => {
      const sellerId = 1;
      const id = 1;

      mockMediaService.findOne.mockResolvedValue(mockMedia);

      const result = await controller.findOne(sellerId, id);

      expect(result).toEqual(mockMedia);
      expect(service.findOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product media record', async () => {
      const sellerId = 1;
      const id = 1;

      const updatedMedia = {
        ...mockMedia,
        alt_text: 'Updated alt text',
      };
      mockMediaService.update.mockResolvedValue(updatedMedia);

      const result = await controller.update(
        sellerId,
        id,
        mockUser,
        undefined,
        'Updated alt text',
        undefined,
        undefined,
      );

      expect(result).toEqual(updatedMedia);
      expect(service.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a product media record', async () => {
      const sellerId = 1;
      const id = 1;

      mockMediaService.remove.mockResolvedValue(undefined);

      await controller.remove(sellerId, id, mockUser);

      expect(service.remove).toHaveBeenCalled();
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

      mockMediaService.linkToProduct.mockResolvedValue(undefined);

      await controller.linkToProduct(sellerId, linkDto, mockUser);

      expect(service.linkToProduct).toHaveBeenCalled();
    });
  });

  describe('unlinkFromProduct', () => {
    it('should unlink media from a product', async () => {
      const sellerId = 1;
      const mappingId = 1;

      mockMediaService.unlinkFromProduct.mockResolvedValue(undefined);

      await controller.unlinkFromProduct(sellerId, mappingId, mockUser);

      expect(service.unlinkFromProduct).toHaveBeenCalled();
    });
  });

  describe('syncProductImages', () => {
    it('should sync product images', async () => {
      const sellerId = 1;
      const syncDto = {
        product_id: 1,
        media_ids: [1, 2, 3],
      };

      mockMediaService.syncProductImages.mockResolvedValue({ success: true });

      const result = await controller.syncProductImages(
        sellerId,
        syncDto as any,
        mockUser,
      );

      expect(result).toEqual({ success: true });
      expect(service.syncProductImages).toHaveBeenCalled();
    });
  });

  describe('getMedia', () => {
    it('should return all media for a product', async () => {
      const sellerId = 1;
      const productId = 1;
      const mockMediaList = [mockMedia];

      mockMediaService.getMedia.mockResolvedValue(mockMediaList);

      const result = await controller.getMedia(sellerId, productId);

      expect(result).toEqual(mockMediaList);
      expect(service.getMedia).toHaveBeenCalled();
    });
  });

  describe('reorderMedia', () => {
    it('should reorder product media', async () => {
      const sellerId = 1;
      const reorderDto: ReorderMediaDto = {
        product_id: 1,
        media_order: [
          { media_id: 1, display_order: 0 },
          { media_id: 2, display_order: 1 },
        ],
      };

      mockMediaService.reorderMedia.mockResolvedValue(undefined);

      await controller.reorderMedia(sellerId, reorderDto, mockUser);

      expect(service.reorderMedia).toHaveBeenCalled();
    });
  });
});
