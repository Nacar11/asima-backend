import { Test, TestingModule } from '@nestjs/testing';
import { DocumentControlsController } from './document-controls.controller';
import { DocumentControlsService } from './document-controls.service';
import { CreateDocumentControlDto } from './dto/create-document-control.dto';
import { UpdateDocumentControlDto } from './dto/update-document-control.dto';
import { DocumentControl } from './domain/document-control';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

describe('DocumentControlsController', () => {
  let documentControlsController: DocumentControlsController;
  let documentControlsService: DocumentControlsService;

  const mockDocumentControlsService = {
    create: jest.fn((dto: CreateDocumentControlDto) => {
      return { id: 1, ...dto }; // Mock document-control return with an ID
    }),
    findManyBy: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock document-control return
    }),
    update: jest.fn((id: string, dto: UpdateDocumentControlDto) => {
      return { id, ...dto }; // Mock updated document-control return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted document-control return
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
      controllers: [DocumentControlsController],
      providers: [
        {
          provide: DocumentControlsService,
          useValue: mockDocumentControlsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    documentControlsController = module.get<DocumentControlsController>(
      DocumentControlsController,
    );
    documentControlsService = module.get<DocumentControlsService>(
      DocumentControlsService,
    );
  });

  describe('create', () => {
    it('should create a document-control', async () => {
      const createDocumentControlDto: CreateDocumentControlDto = {
        menu_id: 1,
        status: MasterStatusEnum.ACTIVE,
        prefix_pattern: 'PR{yy}-PR{MMddyyyy}-PR-{yyyy}',
        last_series: 1,
      };
      const result = await documentControlsController.create(
        createDocumentControlDto,
      );
      expect(result).toEqual({ id: 1, ...createDocumentControlDto });
      expect(documentControlsService.create).toHaveBeenCalledWith(
        createDocumentControlDto,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated document-controls', async () => {
      const query = { skip: 0, take: 20 } as GetQueryParams;

      // Mocking the return value of the documentControlsService.findAllWithPagination
      const mockDocumentControls: Pick<
        DocumentControl,
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
      ]; // Example document-control data

      const totalResults = 2; // Total results mock

      mockDocumentControlsService.findManyBy.mockReturnValueOnce(
        Promise.resolve({
          data: mockDocumentControls,
          totalCount: totalResults,
        }),
      );

      const result: { data: DocumentControl[]; totalCount: number } =
        await documentControlsController.findManyBy(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockDocumentControls);
      expect(result.totalCount).toBe(totalResults);

      // Asserting that documentControlsService.findAllWithPagination was called with the correct parameters
      expect(documentControlsService.findManyBy).toHaveBeenCalledWith(query);
    });
  });
  describe('findAll', () => {
    it('should return document-controls', async () => {
      const mockDocumentControls: Pick<DocumentControl, 'id'>[] = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockDocumentControlsService.findAll.mockResolvedValueOnce(
        mockDocumentControls,
      );

      const result = await documentControlsController.findAll();

      expect(result).toEqual(mockDocumentControls);
      expect(mockDocumentControlsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a document-control by ID', async () => {
      const id = 1;
      const result = await documentControlsController.findById(id);
      expect(result).toEqual({ id });
      expect(documentControlsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a document-control', async () => {
      const id = 1;
      const updateDocumentControlDto: UpdateDocumentControlDto = {};
      const result = await documentControlsController.update(
        id,
        updateDocumentControlDto,
      );
      expect(result).toEqual({ id, ...updateDocumentControlDto });
      expect(documentControlsService.update).toHaveBeenCalledWith(
        id,
        updateDocumentControlDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a document-control', async () => {
      const id = 1;
      await documentControlsController.remove(id);
      expect(documentControlsService.remove).toHaveBeenCalledWith(id);
    });
  });
});
