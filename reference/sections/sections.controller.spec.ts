import { Test, TestingModule } from '@nestjs/testing';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Section } from './domain/section';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/users/domain/user';
import { StatusEnum } from '../users/users.enum';

describe('SectionsController', () => {
  let sectionsController: SectionsController;
  let sectionsService: SectionsService;

  const mockSectionsService = {
    create: jest.fn((dto: CreateSectionDto) => {
      return { id: 1, ...dto }; // Mock section return with an ID
    }),
    findByMany: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock section return
    }),
    update: jest.fn((id: string, dto: UpdateSectionDto) => {
      return { id, ...dto }; // Mock updated section return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted section return
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
      controllers: [SectionsController],
      providers: [
        {
          provide: SectionsService,
          useValue: mockSectionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .compile();

    sectionsController = module.get<SectionsController>(SectionsController);
    sectionsService = module.get<SectionsService>(SectionsService);
  });

  describe('create', () => {
    it('should create a section', async () => {
      const mockUser: User = { id: 1 } as User;
      const createSectionDto: CreateSectionDto = {
        section_code: '00',
        section_name: 'SD1',
        section_head: 1,
      };

      const result = await sectionsController.create(
        createSectionDto,
        mockUser,
      );

      expect(result).toEqual({ id: 1, ...createSectionDto });
      expect(sectionsService.create).toHaveBeenCalledWith(
        createSectionDto,
        mockUser,
      );
    });
  });

  describe('findByMany', () => {
    it('should return paginated sections', async () => {
      const query = { skip: 0, take: 10, sort: {}, filter: [] };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the sectionsService.findByMany
      const mockSections: Section[] = [
        {
          id: 1,
          section_code: '00',
          section_name: 'SD1',
          section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          section_code: '01',
          section_name: 'SD2',
          section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example section data

      const totalCount = 2; // Total count mock

      mockSectionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockSections,
          totalCount,
        }),
      );

      const result = await sectionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockSections);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that sectionsService.findByMany was called with the correct parameters
      expect(sectionsService.findByMany).toHaveBeenCalledWith(query);
    });

    it('should return filtered paginated sections', async () => {
      const query = {
        filter: ['section_name', 'contains', 'D2'],
        skip: 0,
        take: 10,
        sort: {},
      };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the sectionsService.findByMany
      const mockSections: Section[] = [
        {
          id: 1,
          section_code: '00',
          section_name: 'SD1',
          section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          section_code: '01',
          section_name: 'SD2',
          section_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example section data

      const totalCount = 2; // Total count mock

      mockSectionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockSections,
          totalCount,
        }),
      );

      const result = await sectionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockSections);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that sectionsService.findByMany was called with the correct parameters
      expect(sectionsService.findByMany).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return all active or new sections', async () => {
      // Arrange: Mock the service's return value
      const mockDivisions: Pick<Section, 'section_code' | 'section_name'>[] = [
        { section_code: '00', section_name: 'SD1' },
        { section_code: '01', section_name: 'SD2' },
      ];

      mockSectionsService.findAll.mockResolvedValue(mockDivisions);

      // Act: Call the controller method
      const result = await sectionsController.findAll();

      // Assert: Verify the result matches the mock data
      expect(result).toEqual(mockDivisions);
      expect(mockSectionsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a section by ID', async () => {
      const id = 1;
      const result = await sectionsController.findById(id);
      expect(result).toEqual({ id });
      expect(sectionsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a section', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const updateSectionDto: UpdateSectionDto = {
        status: StatusEnum.ACTIVE,
      };

      const result = await sectionsController.update(
        id,
        updateSectionDto,
        mockUser,
      );

      expect(result).toEqual({ id, ...updateSectionDto });
      expect(sectionsService.update).toHaveBeenCalledWith(
        id,
        updateSectionDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a section', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await sectionsController.remove(id, mockUser);
      expect(sectionsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
