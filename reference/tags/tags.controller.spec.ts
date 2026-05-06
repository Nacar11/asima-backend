import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from '@/tags/tags.controller';
import { TagsService } from '@/tags/tags.service';
import { CreateTagDto } from '@/tags/dto/create-tag.dto';
import { UpdateTagDto } from '@/tags/dto/update-tag.dto';
import { Tag } from '@/tags/domain/tag';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('TagsController', () => {
  let controller: TagsController;
  let service: TagsService;

  const mockTag: Tag = {
    id: 1,
    seller_id: 1,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    product_count: 5,
    display_order: 1,
    status: 'Active',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    created_by: {
      id: 1,
      user_id: '1000000',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified: false,
      phone_verified: false,
      password: 'hash',
      salt: 'salt',
      system_admin: false,
      cost_center: null,
      status: 'active',
      created_by: null,
      updated_by: null,
      deleted_by: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
    updated_by: null,
    deleted_by: null,
    deleted_at: null,
  };

  const mockUser = {
    id: 1,
    user_id: '1000000',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    email_verified: false,
    phone_verified: false,
    system_admin: false,
    seller_id: 1,
    seller: {
      id: 1,
      user_id: 1,
      store_name: 'Tech Store',
    },
  };

  const mockTagsService = {
    create: jest.fn(),
    findBySeller: jest.fn(),
    findOneBySlug: jest.fn(),
    updateBySlug: jest.fn(),
    removeBySlug: jest.fn(),
    bulkDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TagsController>(TagsController);
    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tag for a seller without providing slug (auto-generated)', async () => {
      const createTagDto: CreateTagDto = {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        status: 'Active',
      };

      mockTagsService.create.mockResolvedValue(mockTag);

      const result = await controller.create(1, createTagDto, mockUser as any);

      expect(result).toEqual(mockTag);
      expect(service.create).toHaveBeenCalledWith(createTagDto, mockUser, 1);
    });

    it('should create a tag for a seller with custom slug', async () => {
      const createTagDto: CreateTagDto = {
        name: 'Electronics',
        slug: 'custom-electronics-slug',
        description: 'Electronic devices and gadgets',
        status: 'Active',
      };

      const tagWithCustomSlug = {
        ...mockTag,
        slug: 'custom-electronics-slug',
      };

      mockTagsService.create.mockResolvedValue(tagWithCustomSlug);

      const result = await controller.create(1, createTagDto, mockUser as any);

      expect(result).toEqual(tagWithCustomSlug);
      expect(service.create).toHaveBeenCalledWith(createTagDto, mockUser, 1);
    });

    it('should create a tag without status (defaults to Active)', async () => {
      const createTagDto: CreateTagDto = {
        name: 'New Tag',
        description: 'A new tag without explicit status',
      };

      const tagWithDefaultStatus = {
        ...mockTag,
        name: 'New Tag',
        slug: 'new-tag',
        description: 'A new tag without explicit status',
        status: 'Active',
      };

      mockTagsService.create.mockResolvedValue(tagWithDefaultStatus);

      const result = await controller.create(1, createTagDto, mockUser as any);

      expect(result).toEqual(tagWithDefaultStatus);
      expect(service.create).toHaveBeenCalledWith(createTagDto, mockUser, 1);
    });

    it('should throw error if user is not the seller owner', async () => {
      const createTagDto: CreateTagDto = {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      };

      const nonOwnerUser = {
        ...mockUser,
        system_admin: false,
        seller_id: 2,
        seller: {
          id: 2, // Different seller
          user_id: 2,
          store_name: 'Other Store',
        },
      };

      await expect(
        controller.create(1, createTagDto, nonOwnerUser as any),
      ).rejects.toThrow();
    });
  });

  describe('findBySeller - Public Endpoint', () => {
    it('should get all tags for a seller without authentication', async () => {
      const queryParams = {
        skip: 0,
        take: 10,
        sort: {},
        filter: [],
      } as GetQueryParams;

      const mockResult = {
        data: [mockTag],
        totalCount: 1,
      };

      mockTagsService.findBySeller.mockResolvedValue(mockResult);

      const result = await controller.findBySeller(1, queryParams);

      expect(result).toEqual(mockResult);
      expect(service.findBySeller).toHaveBeenCalledWith(1, queryParams);
    });

    it('should get tags with filters', async () => {
      const queryParams = {
        skip: 0,
        take: 10,
        sort: {},
        filter: [['status', '=', 'Active']],
      } as GetQueryParams;

      const mockResult = {
        data: [mockTag],
        totalCount: 1,
      };

      mockTagsService.findBySeller.mockResolvedValue(mockResult);

      const result = await controller.findBySeller(1, queryParams);

      expect(result).toEqual(mockResult);
      expect(service.findBySeller).toHaveBeenCalledWith(1, queryParams);
    });
  });

  describe('findOne - Public Endpoint', () => {
    it('should get a tag by slug without authentication', async () => {
      mockTagsService.findOneBySlug.mockResolvedValue(mockTag);

      const result = await controller.findOne(1, 'electronics');

      expect(result).toEqual(mockTag);
      expect(service.findOneBySlug).toHaveBeenCalledWith(1, 'electronics');
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateTagDto: UpdateTagDto = {
        description: 'Updated description',
        status: 'Inactive',
      };

      const updatedTag = {
        ...mockTag,
        description: 'Updated description',
        status: 'Inactive',
      };

      mockTagsService.updateBySlug.mockResolvedValue(updatedTag);

      const result = await controller.update(
        1,
        'electronics',
        updateTagDto,
        mockUser as any,
      );

      expect(result).toEqual(updatedTag);
      expect(service.updateBySlug).toHaveBeenCalledWith(
        1,
        'electronics',
        updateTagDto,
        mockUser,
      );
    });

    it('should throw error if user is not the seller owner', async () => {
      const updateTagDto: UpdateTagDto = {
        description: 'Updated description',
      };

      const nonOwnerUser = {
        ...mockUser,
        system_admin: false,
        seller_id: 2,
        seller: {
          id: 2, // Different seller
          user_id: 2,
          store_name: 'Other Store',
        },
      };

      await expect(
        controller.update(1, 'electronics', updateTagDto, nonOwnerUser as any),
      ).rejects.toThrow();
    });

    it('should allow system admin to update any tag', async () => {
      const updateTagDto: UpdateTagDto = {
        description: 'Admin updated description',
      };

      const adminUser = {
        ...mockUser,
        system_admin: true,
      };

      const updatedTag = {
        ...mockTag,
        description: 'Admin updated description',
      };

      mockTagsService.updateBySlug.mockResolvedValue(updatedTag);

      const result = await controller.update(
        1,
        'electronics',
        updateTagDto,
        adminUser as any,
      );

      expect(result).toEqual(updatedTag);
      expect(service.updateBySlug).toHaveBeenCalledWith(
        1,
        'electronics',
        updateTagDto,
        adminUser,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a tag', async () => {
      const mockResponse = {
        message: 'Tag deleted successfully',
        affected_products: 5,
      };

      mockTagsService.removeBySlug.mockResolvedValue(mockResponse);

      const result = await controller.remove(1, 'electronics', mockUser as any);

      expect(result).toEqual(mockResponse);
      expect(service.removeBySlug).toHaveBeenCalledWith(
        1,
        'electronics',
        mockUser,
      );
    });

    it('should throw error if user is not the seller owner', async () => {
      const nonOwnerUser = {
        ...mockUser,
        system_admin: false,
        seller_id: 2,
        seller: {
          id: 2, // Different seller
          user_id: 2,
          store_name: 'Other Store',
        },
      };

      await expect(
        controller.remove(1, 'electronics', nonOwnerUser as any),
      ).rejects.toThrow();
    });
  });

  describe('bulkDelete', () => {
    it('should bulk delete multiple tags', async () => {
      const body = { tag_ids: [1, 2, 3] };

      const mockResponse = {
        message: '3 tags deleted successfully',
        deleted_count: 3,
        affected_products: 10,
      };

      mockTagsService.bulkDelete.mockResolvedValue(mockResponse);

      const result = await controller.bulkDelete(1, body, mockUser as any);

      expect(result).toEqual(mockResponse);
      expect(service.bulkDelete).toHaveBeenCalledWith(body.tag_ids, mockUser);
    });

    it('should throw error if user is not the seller owner', async () => {
      const body = { tag_ids: [1, 2, 3] };

      const nonOwnerUser = {
        ...mockUser,
        system_admin: false,
        seller_id: 2,
        seller: {
          id: 2, // Different seller
          user_id: 2,
          store_name: 'Other Store',
        },
      };

      await expect(
        controller.bulkDelete(1, body, nonOwnerUser as any),
      ).rejects.toThrow();
    });
  });
});
