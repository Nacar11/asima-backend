import { Test, TestingModule } from '@nestjs/testing';
import {
  FeaturedProductsPublicController,
  FeaturedProductsAdminController,
  FeaturedProductsAdminSingleController,
} from './featured-products.controller';
import { FeaturedProductsService } from './featured-products.service';
import { FeaturedSectionEnum } from '@/products/products.enum';

describe('FeaturedProductsController', () => {
  let publicController: FeaturedProductsPublicController;
  let adminController: FeaturedProductsAdminController;
  let singleController: FeaturedProductsAdminSingleController;
  let service: FeaturedProductsService;

  const mockFeaturedProductsService = {
    findAllPublic: jest.fn(),
    findAllAdmin: jest.fn(),
    setFeatured: jest.fn(),
    removeFeatured: jest.fn(),
    batchSetFeatured: jest.fn(),
    reorder: jest.fn(),
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
        FeaturedProductsPublicController,
        FeaturedProductsAdminController,
        FeaturedProductsAdminSingleController,
      ],
      providers: [
        {
          provide: FeaturedProductsService,
          useValue: mockFeaturedProductsService,
        },
      ],
    }).compile();

    publicController = module.get<FeaturedProductsPublicController>(
      FeaturedProductsPublicController,
    );
    adminController = module.get<FeaturedProductsAdminController>(
      FeaturedProductsAdminController,
    );
    singleController = module.get<FeaturedProductsAdminSingleController>(
      FeaturedProductsAdminSingleController,
    );
    service = module.get<FeaturedProductsService>(FeaturedProductsService);

    jest.clearAllMocks();
  });

  describe('FeaturedProductsPublicController', () => {
    it('should be defined', () => {
      expect(publicController).toBeDefined();
    });

    describe('findAll', () => {
      it('should return featured products', async () => {
        const expectedResult = {
          data: [],
          totalCount: 0,
          skip: 0,
          take: 20,
        };
        mockFeaturedProductsService.findAllPublic.mockResolvedValue(
          expectedResult,
        );

        const result = await publicController.findAll({} as any);

        expect(result).toEqual(expectedResult);
        expect(service.findAllPublic).toHaveBeenCalledWith({});
      });

      it('should pass query parameters to service', async () => {
        const query = {
          section: FeaturedSectionEnum.BESTSELLERS,
          skip: 10,
          take: 5,
        };
        mockFeaturedProductsService.findAllPublic.mockResolvedValue({
          data: [],
          totalCount: 0,
          skip: 10,
          take: 5,
        });

        await publicController.findAll(query as any);

        expect(service.findAllPublic).toHaveBeenCalledWith(query);
      });
    });
  });

  describe('FeaturedProductsAdminController', () => {
    it('should be defined', () => {
      expect(adminController).toBeDefined();
    });

    describe('findAll', () => {
      it('should return all featured products for admin', async () => {
        const expectedResult = {
          data: [],
          totalCount: 0,
          skip: 0,
          take: 20,
        };
        mockFeaturedProductsService.findAllAdmin.mockResolvedValue(
          expectedResult,
        );

        const result = await adminController.findAll({} as any);

        expect(result).toEqual(expectedResult);
        expect(service.findAllAdmin).toHaveBeenCalledWith({});
      });
    });

    describe('batchSetFeatured', () => {
      it('should batch update featured products', async () => {
        const dto = {
          products: [{ product_id: 1, is_featured: true }],
        };
        const expectedResult = [{ id: 1, is_featured: true }];
        mockFeaturedProductsService.batchSetFeatured.mockResolvedValue(
          expectedResult,
        );

        const result = await adminController.batchSetFeatured(
          dto,
          mockAdmin as any,
        );

        expect(result).toEqual(expectedResult);
        expect(service.batchSetFeatured).toHaveBeenCalledWith(dto, mockAdmin);
      });
    });

    describe('reorder', () => {
      it('should reorder featured products within section', async () => {
        const dto = {
          product_ids: [3, 1, 2],
          section: FeaturedSectionEnum.FEATURED,
        };
        const expectedResult = [
          {
            id: 3,
            featured_sections: [{ section: 'featured', display_order: 1 }],
          },
          {
            id: 1,
            featured_sections: [{ section: 'featured', display_order: 2 }],
          },
          {
            id: 2,
            featured_sections: [{ section: 'featured', display_order: 3 }],
          },
        ];
        mockFeaturedProductsService.reorder.mockResolvedValue(expectedResult);

        const result = await adminController.reorder(dto as any);

        expect(result).toEqual(expectedResult);
        expect(service.reorder).toHaveBeenCalledWith(dto);
      });
    });
  });

  describe('FeaturedProductsAdminSingleController', () => {
    it('should be defined', () => {
      expect(singleController).toBeDefined();
    });

    describe('setFeatured', () => {
      it('should add product to featured section', async () => {
        const dto = {
          featured_section: FeaturedSectionEnum.FEATURED,
          featured_order: 1,
        };
        const expectedResult = {
          id: 1,
          featured_sections: [{ section: 'featured', display_order: 1 }],
        };
        mockFeaturedProductsService.setFeatured.mockResolvedValue(
          expectedResult,
        );

        const result = await singleController.setFeatured(
          1,
          dto,
          mockAdmin as any,
        );

        expect(result).toEqual(expectedResult);
        expect(service.setFeatured).toHaveBeenCalledWith(1, dto, mockAdmin);
      });

      it('should add product to multiple sections', async () => {
        const dto = {
          featured_section: FeaturedSectionEnum.BESTSELLERS,
        };
        const expectedResult = {
          id: 1,
          featured_sections: [
            { section: 'featured', display_order: 1 },
            { section: 'bestsellers', display_order: 1 },
          ],
        };
        mockFeaturedProductsService.setFeatured.mockResolvedValue(
          expectedResult,
        );

        const result = await singleController.setFeatured(
          1,
          dto,
          mockAdmin as any,
        );

        expect(result).toEqual(expectedResult);
        expect(service.setFeatured).toHaveBeenCalledWith(1, dto, mockAdmin);
      });
    });

    describe('removeFeatured', () => {
      it('should remove product from featured section', async () => {
        const dto = { section: FeaturedSectionEnum.FEATURED };
        const expectedResult = {
          id: 1,
          featured_sections: [],
        };
        mockFeaturedProductsService.removeFeatured.mockResolvedValue(
          expectedResult,
        );

        const result = await singleController.removeFeatured(1, dto);

        expect(result).toEqual(expectedResult);
        expect(service.removeFeatured).toHaveBeenCalledWith(1, dto);
      });

      it('should only remove from specified section', async () => {
        const dto = { section: FeaturedSectionEnum.FEATURED };
        const expectedResult = {
          id: 1,
          featured_sections: [{ section: 'bestsellers', display_order: 1 }],
        };
        mockFeaturedProductsService.removeFeatured.mockResolvedValue(
          expectedResult,
        );

        const result = await singleController.removeFeatured(1, dto);

        expect(result).toEqual(expectedResult);
        expect(service.removeFeatured).toHaveBeenCalledWith(1, dto);
      });
    });
  });
});
