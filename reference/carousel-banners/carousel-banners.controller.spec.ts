import { Test, TestingModule } from '@nestjs/testing';
import { CarouselBannersPublicController } from '@/carousel-banners/carousel-banners-public.controller';
import { CarouselBannersAdminController } from '@/carousel-banners/carousel-banners-admin.controller';
import { CarouselBannersService } from '@/carousel-banners/carousel-banners.service';
import { QueryCarouselBannersAdminDto } from '@/carousel-banners/dto/query-carousel-banners-admin.dto';
import { QueryCarouselBannersDto } from '@/carousel-banners/dto/query-carousel-banners.dto';
import { SyncCarouselBannersDto } from '@/carousel-banners/dto/sync-carousel-banners.dto';
import { UpdateCarouselBannerDto } from '@/carousel-banners/dto/update-carousel-banner.dto';
import { CreateCarouselBannerDto } from '@/carousel-banners/dto/create-carousel-banner.dto';
import { User } from '@/users/domain/user';

describe('CarouselBannersController', () => {
  let publicController: CarouselBannersPublicController;
  let adminController: CarouselBannersAdminController;
  let service: CarouselBannersService;

  const mockCarouselBannersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllPublic: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    syncCarouselBanners: jest.fn(),
  };

  const mockAdmin = {
    id: 1,
    first_name: 'Admin',
    last_name: 'User',
    system_admin: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        CarouselBannersPublicController,
        CarouselBannersAdminController,
      ],
      providers: [
        {
          provide: CarouselBannersService,
          useValue: mockCarouselBannersService,
        },
      ],
    }).compile();

    publicController = module.get<CarouselBannersPublicController>(
      CarouselBannersPublicController,
    );
    adminController = module.get<CarouselBannersAdminController>(
      CarouselBannersAdminController,
    );
    service = module.get<CarouselBannersService>(CarouselBannersService);

    jest.clearAllMocks();
  });

  describe('CarouselBannersPublicController', () => {
    it('should be defined', () => {
      expect(publicController).toBeDefined();
    });

    it('should call service.findAllPublic on findAll', async () => {
      const expectedResult = { data: [], totalCount: 0, skip: 0, take: 20 };
      mockCarouselBannersService.findAllPublic.mockResolvedValue(
        expectedResult,
      );
      const inputQuery: QueryCarouselBannersDto =
        {} as unknown as QueryCarouselBannersDto;
      const actualResult = await publicController.findAll(inputQuery);
      expect(actualResult).toEqual(expectedResult);
      expect(service.findAllPublic).toHaveBeenCalledWith(inputQuery);
    });

    it('should call service.findById on findById', async () => {
      const expectedResult = { id: 1 };
      mockCarouselBannersService.findById.mockResolvedValue(expectedResult);
      const actualResult = await publicController.findById(1);
      expect(actualResult).toEqual(expectedResult);
      expect(service.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('CarouselBannersAdminController', () => {
    it('should be defined', () => {
      expect(adminController).toBeDefined();
    });

    it('should call service.create on create', async () => {
      const inputDto = { headline: 'Banner' };
      const expectedResult = { id: 1 };
      mockCarouselBannersService.create.mockResolvedValue(expectedResult);
      const inputCreateDto: CreateCarouselBannerDto =
        inputDto as unknown as CreateCarouselBannerDto;
      const inputUser: User = mockAdmin as unknown as User;
      const actualResult = await adminController.create(
        inputCreateDto,
        inputUser,
      );
      expect(actualResult).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(inputCreateDto, inputUser);
    });

    it('should call service.findAll on findAll', async () => {
      const expectedResult = { data: [], totalCount: 0, skip: 0, take: 20 };
      mockCarouselBannersService.findAll.mockResolvedValue(expectedResult);
      const inputQuery: QueryCarouselBannersAdminDto =
        {} as unknown as QueryCarouselBannersAdminDto;
      const actualResult = await adminController.findAll(inputQuery);
      expect(actualResult).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(inputQuery);
    });

    it('should call service.syncCarouselBanners on syncCarouselBanners', async () => {
      const inputDto = { banners: [] };
      const expectedResult = [];
      mockCarouselBannersService.syncCarouselBanners.mockResolvedValue(
        expectedResult,
      );
      const inputSyncDto: SyncCarouselBannersDto =
        inputDto as unknown as SyncCarouselBannersDto;
      const inputUser: User = mockAdmin as unknown as User;
      const actualResult = await adminController.syncCarouselBanners(
        inputSyncDto,
        inputUser,
      );
      expect(actualResult).toEqual(expectedResult);
      expect(service.syncCarouselBanners).toHaveBeenCalledWith(
        inputSyncDto,
        inputUser,
      );
    });

    it('should call service.update on update', async () => {
      const inputId = 1;
      const inputDto = { headline: 'Updated' };
      const expectedResult = { id: inputId };
      mockCarouselBannersService.update.mockResolvedValue(expectedResult);
      const inputUpdateDto: UpdateCarouselBannerDto =
        inputDto as unknown as UpdateCarouselBannerDto;
      const inputUser: User = mockAdmin as unknown as User;
      const actualResult = await adminController.update(
        inputId,
        inputUpdateDto,
        inputUser,
      );
      expect(actualResult).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(
        inputId,
        inputUpdateDto,
        inputUser,
      );
    });

    it('should call service.delete on delete', async () => {
      const inputId = 1;
      mockCarouselBannersService.delete.mockResolvedValue(undefined);
      const inputUser: User = mockAdmin as unknown as User;
      const actualResult = await adminController.delete(inputId, inputUser);
      expect(actualResult).toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(inputId, inputUser);
    });
  });
});
