import { Test, TestingModule } from '@nestjs/testing';
import { MediaAdminsService } from './media-admins.service';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { StorageService } from '@/storage/storage.service';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';
import { BaseCategoryRepository } from '@/categories/persistence/base-category.repository';

describe('MediaAdminsService', () => {
  let service: MediaAdminsService;

  const mockMediaRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockStorageService = {
    put: jest.fn(),
    putBuffer: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const mockImageProcessor = {
    processImage: jest.fn(),
    processVideo: jest.fn(),
  };

  const mockCategoryRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaAdminsService,
        { provide: MediaRepository, useValue: mockMediaRepository },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ImageProcessorService,
          useValue: mockImageProcessor,
        },
        {
          provide: BaseCategoryRepository,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<MediaAdminsService>(MediaAdminsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
