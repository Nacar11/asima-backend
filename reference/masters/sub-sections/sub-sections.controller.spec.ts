import { Test, TestingModule } from '@nestjs/testing';
import { SubSectionsController } from './sub-sections.controller';
import { SubSectionsService } from './sub-sections.service';
import { CreateSubSectionDto } from './dto/create-sub-section.dto';
import { UpdateSubSectionDto } from './dto/update-sub-section.dto';
import { SubSection } from './domain/sub-section';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';

describe('SubSectionsController', () => {
  let subSectionsController: SubSectionsController;
  let subSectionsService: SubSectionsService;

  const mockSubSectionsService = {
    create: jest.fn((dto: CreateSubSectionDto) => {
      return { id: 1, ...dto }; // Mock sub-section return with an ID
    }),
    findByMany: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock sub-section return
    }),
    update: jest.fn((id: string, dto: UpdateSubSectionDto) => {
      return { id, ...dto }; // Mock updated sub-section return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted sub-section return
  };

  beforeEach(async () => {
    // Mocked AuthGuard to simulate a logged-in user
    const AuthGuardMock = {
      canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        // Attach a mock user to the request object to simulate a logged-in user
        request.user = { id: 1, username: 'mock-user' };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubSectionsController],
      providers: [
        {
          provide: SubSectionsService,
          useValue: mockSubSectionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .compile();

    subSectionsController = module.get<SubSectionsController>(
      SubSectionsController,
    );
    subSectionsService = module.get<SubSectionsService>(SubSectionsService);
  });

  describe('create', () => {
    it('should create a sub-section', async () => {
      const mockUser: User = { id: 1 } as User;
      const createSubSectionDto: CreateSubSectionDto = {
        sub_section_code: '00',
        sub_section_name: 'Backend',
        sub_section_head: 1,
      };

      const result = await subSectionsController.create(
        createSubSectionDto,
        mockUser,
      );

      expect(result).toEqual({ id: 1, ...createSubSectionDto });
      expect(subSectionsService.create).toHaveBeenCalledWith(
        createSubSectionDto,
        mockUser,
      );
    });
  });

  describe('findByMany', () => {
    it('should return paginated sub-sections', async () => {
      const query = { skip: 0, take: 10, sort: {}, filter: [] };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the subSectionsService.findByMany
      const mockSubSections: SubSection[] = [
        {
          id: 1,
          sub_section_code: '00',
          sub_section_name: 'Backend',
          sub_section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          sub_section_code: '01',
          sub_section_name: 'Mobile',
          sub_section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example sub-section data

      const totalCount = 2; // Total count mock

      mockSubSectionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockSubSections,
          totalCount,
        }),
      );

      const result = await subSectionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockSubSections);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that subSectionsService.findByMany was called with the correct parameters
      expect(subSectionsService.findByMany).toHaveBeenCalledWith(query);
    });

    it('should return filtered paginated sub-sections', async () => {
      const query = {
        skip: 0,
        take: 10,
        sort: {},
        filter: [['sub_section_name', 'contains', 'Backend']],
      };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the subSectionsService.findByMany
      const mockSubSections: SubSection[] = [
        {
          id: 1,
          sub_section_code: '00',
          sub_section_name: 'Backend',
          sub_section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example sub-section data

      const totalCount = 1; // Total count mock

      mockSubSectionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockSubSections,
          totalCount,
        }),
      );

      const result = await subSectionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockSubSections);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that subSectionsService.findByMany was called with the correct parameters
      expect(subSectionsService.findByMany).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return all active or new sub-sections', async () => {
      // Arrange: Mock the service's return value
      const mockDivisions: Pick<
        SubSection,
        'sub_section_code' | 'sub_section_name'
      >[] = [
        { sub_section_code: '00', sub_section_name: 'Backend' },
        { sub_section_code: '01', sub_section_name: 'Mobile' },
      ];

      mockSubSectionsService.findAll.mockResolvedValue(mockDivisions);

      // Act: Call the controller method
      const result = await subSectionsController.findAll();

      // Assert: Verify the result matches the mock data
      expect(result).toEqual(mockDivisions);
      expect(mockSubSectionsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a sub-section by ID', async () => {
      const id = 1;
      const result = await subSectionsController.findById(id);
      expect(result).toEqual({ id });
      expect(subSectionsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a sub-section', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const updateSubSectionDto: UpdateSubSectionDto = {
        status: StatusEnum.ACTIVE,
      };
      const result = await subSectionsController.update(
        id,
        updateSubSectionDto,
        mockUser,
      );
      expect(result).toEqual({ id, ...updateSubSectionDto });
      expect(subSectionsService.update).toHaveBeenCalledWith(
        id,
        updateSubSectionDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a sub-section', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await subSectionsController.remove(id, mockUser);
      expect(subSectionsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
