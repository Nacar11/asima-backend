import { User } from '@/users/domain/user';
import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsController } from '@/attachments/attachments.controller';
import { AttachmentsService } from '@/attachments/attachments.service';
import { CreateAttachmentsDto } from '@/attachments/dto/create-attachments.dto';
import { UpdateAttachmentsDto } from '@/attachments/dto/update-attachments.dto';
import { Attachments } from '@/attachments/domain/attachments';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecordTypeEnum, StatusEnum } from '@/attachments/attachments.enum';

describe('AttachmentsController', () => {
  let attachmentsController: AttachmentsController;
  let attachmentsService: AttachmentsService;

  const mockAttachmentsService = {
    create: jest.fn((dto: CreateAttachmentsDto) => {
      return { id: 1, ...dto }; // Mock attachments return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock attachments return
    }),
    update: jest.fn((id: string, dto: UpdateAttachmentsDto) => {
      return { id, ...dto }; // Mock updated attachments return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted attachments return
  };

  beforeEach(async () => {
    const authGuardMock = {
      canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { id: 1, username: 'mock-user' };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    attachmentsController = module.get<AttachmentsController>(
      AttachmentsController,
    );
    attachmentsService = module.get<AttachmentsService>(AttachmentsService);
  });

  describe('create', () => {
    it('should create a attachments', async () => {
      const mockUser: User = { id: 1 } as User;
      const createAttachmentsDto: CreateAttachmentsDto = {
        record_id: 1,
        record_type: RecordTypeEnum.EMPLOYEE_CERTIFICATE,
        file_path:
          'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
        status: StatusEnum.ACTIVE,
      };
      const result = await attachmentsController.create(
        createAttachmentsDto,
        mockUser,
      );
      expect(result).toEqual({ id: 1, ...createAttachmentsDto });
      expect(attachmentsService.create).toHaveBeenCalledWith(
        createAttachmentsDto,
        mockUser,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated attachments', async () => {
      const query = { page: 1, limit: 10 };

      // Mocking the return value of the attachmentsService.findAllWithPagination
      const mockAttachments: Pick<
        Attachments,
        'id' | 'created_at' | 'updated_at'
      >[] = [
        {
          id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]; // Example attachments data

      const totalResults = 2; // Total results mock

      mockAttachmentsService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockAttachments,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<Attachments> =
        await attachmentsController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockAttachments);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 attachments and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that attachmentsService.findAllWithPagination was called with the correct parameters
      expect(attachmentsService.findAllWithPagination).toHaveBeenCalledWith({
        paginationOptions: { page: 1, limit: 10 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a attachments by ID', async () => {
      const id = 1;
      const result = await attachmentsController.findById(id);
      expect(result).toEqual({ id });
      expect(attachmentsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a attachments', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      const updateAttachmentsDto: UpdateAttachmentsDto = {};
      const result = await attachmentsController.update(
        id,
        updateAttachmentsDto,
        mockUser,
      );
      expect(result).toEqual({ id, ...updateAttachmentsDto });
      expect(attachmentsService.update).toHaveBeenCalledWith(
        id,
        updateAttachmentsDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a attachments', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      await attachmentsController.remove(id, mockUser);
      expect(attachmentsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
