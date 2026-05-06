import { Test, TestingModule } from '@nestjs/testing';
import { MediaAdminsController } from './media-admins.controller';
import { MediaAdminsService } from './services/media-admins.service';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { LinkGlobalCategoryMediaDto } from '@/media/admins/dto/link-global-category-media.dto';
import { Media } from '@/media/domain/media';
import { MediaTypeEnum } from '@/media/domain/media-type.enum';
import { ProcessingStatusEnum } from '@/media/domain/processing-status.enum';
import { StatusEnum } from '@/utils/enums/status-enum';

describe('MediaAdminsController', () => {
  let controller: MediaAdminsController;
  let service: MediaAdminsService;

  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    system_admin: true,
  } as any;

  const mockMedia: Media = {
    id: 1,
    media_type: MediaTypeEnum.IMAGE,
    file_name: 'test-image.jpg',
    file_path: 'media/admins/1/images/originals/test-image.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    width: 1920,
    height: 1080,
    processing_status: ProcessingStatusEnum.COMPLETED,
    status: StatusEnum.ACTIVE,
    alt_text: 'Test image',
    description: 'A test image',
    created_at: new Date(),
    updated_at: new Date(),
  } as any;

  const mockService = {
    uploadFile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMediaFileUrl: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    linkToGlobalCategory: jest.fn(),
    unlinkFromGlobalCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaAdminsController],
      providers: [
        {
          provide: MediaAdminsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MediaAdminsController>(MediaAdminsController);
    service = module.get<MediaAdminsService>(MediaAdminsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    const adminId = 1;
    const query: GetMediaDto = { page: 1, limit: 10, sort: '-created_at' };
    const mockResponse = { data: [mockMedia], totalCount: 1 };
    mockService.findAll.mockResolvedValue(mockResponse);
    const result = await controller.findAll(adminId, query);
    expect(result).toEqual(mockResponse);
    expect(service.findAll).toHaveBeenCalledWith(adminId, query);
  });

  it('should call linkToGlobalCategory', async () => {
    const adminId = 1;
    const categoryId = 10;
    const dto: LinkGlobalCategoryMediaDto = {
      media_id: 1,
    };

    const mockResponse = { id: categoryId };
    mockService.linkToGlobalCategory.mockResolvedValue(mockResponse);

    const result = await controller.linkToGlobalCategory(
      adminId,
      categoryId,
      dto,
      mockUser,
    );
    expect(result).toEqual(mockResponse);
    expect(service.linkToGlobalCategory).toHaveBeenCalledWith(
      adminId,
      categoryId,
      dto.media_id,
      mockUser,
    );
  });

  it('should call unlinkFromGlobalCategory', async () => {
    const adminId = 1;
    const categoryId = 10;

    const mockResponse = { id: categoryId };
    mockService.unlinkFromGlobalCategory.mockResolvedValue(mockResponse);

    const result = await controller.unlinkFromGlobalCategory(
      adminId,
      categoryId,
      mockUser,
    );
    expect(result).toEqual(mockResponse);
    expect(service.unlinkFromGlobalCategory).toHaveBeenCalledWith(
      categoryId,
      mockUser,
    );
  });
});
