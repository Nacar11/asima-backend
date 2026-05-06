import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSignatoriesController } from './document-signatories.controller';
import { DocumentSignatoriesService } from './document-signatories.service';
import { CreateDocumentSignatoryDto } from './dto/create-document-signatory.dto';
import { UpdateDocumentSignatoryDto } from './dto/update-document-signatory.dto';
import { DocumentSignatory } from './domain/document-signatory';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Menu } from '@/menus/domain/menu';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

describe('DocumentSignatoriesController', () => {
  let documentSignatoriesController: DocumentSignatoriesController;
  let documentSignatoriesService: DocumentSignatoriesService;

  const mockDocumentSignatoriesService = {
    create: jest.fn((dto: CreateDocumentSignatoryDto) => {
      return { id: 1, ...dto }; // Mock document-signatory return with an ID
    }),
    findManyBy: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock document-signatory return
    }),
    update: jest.fn((id: string, dto: UpdateDocumentSignatoryDto) => {
      return { id, ...dto }; // Mock updated document-signatory return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted document-signatory return
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
      controllers: [DocumentSignatoriesController],
      providers: [
        {
          provide: DocumentSignatoriesService,
          useValue: mockDocumentSignatoriesService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    documentSignatoriesController = module.get<DocumentSignatoriesController>(
      DocumentSignatoriesController,
    );
    documentSignatoriesService = module.get<DocumentSignatoriesService>(
      DocumentSignatoriesService,
    );
  });

  describe('create', () => {
    it('should create a document-signatory', async () => {
      const createDocumentSignatoryDto: CreateDocumentSignatoryDto = {
        menu: { id: 1 } as Menu,
        description: 'string',
      };
      const result = await documentSignatoriesController.create(
        createDocumentSignatoryDto,
      );
      expect(result).toEqual({ id: 1, ...createDocumentSignatoryDto });
      expect(documentSignatoriesService.create).toHaveBeenCalledWith(
        createDocumentSignatoryDto,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated document signatories', async () => {
      const query = { skip: 0, take: 20 } as GetQueryParams;

      // Mocking the return value of the documentSignatoriesService.findManyBy
      const mockPurchaseRequests: Pick<
        DocumentSignatory,
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
      ]; // Example document signatories data

      const totalCount = 2; // Total results mock

      mockDocumentSignatoriesService.findManyBy.mockReturnValueOnce(
        Promise.resolve({
          data: mockPurchaseRequests,
          totalCount,
        }),
      );

      const result: { data: DocumentSignatory[]; totalCount: number } =
        await documentSignatoriesController.findManyBy(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockPurchaseRequests);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that documentSignatoriesService.findByMany was called with the correct parameters
      expect(documentSignatoriesService.findManyBy).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return document-signatories', async () => {
      const mockDocumentSignatories: Pick<DocumentSignatory, 'id'>[] = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockDocumentSignatoriesService.findAll.mockResolvedValueOnce(
        mockDocumentSignatories,
      );

      const result = await documentSignatoriesController.findAll();

      expect(result).toEqual(mockDocumentSignatories);
      expect(mockDocumentSignatoriesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a document-signatory by ID', async () => {
      const id = 1;
      const result = await documentSignatoriesController.findById(id);
      expect(result).toEqual({ id });
      expect(documentSignatoriesService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a document-signatory', async () => {
      const id = 1;
      const updateDocumentSignatoryDto: UpdateDocumentSignatoryDto = {};
      const result = await documentSignatoriesController.update(
        id,
        updateDocumentSignatoryDto,
      );
      expect(result).toEqual({ id, ...updateDocumentSignatoryDto });
      expect(documentSignatoriesService.update).toHaveBeenCalledWith(
        id,
        updateDocumentSignatoryDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a document-signatory', async () => {
      const id = 1;
      await documentSignatoriesController.remove(id);
      expect(documentSignatoriesService.remove).toHaveBeenCalledWith(id);
    });
  });
});
