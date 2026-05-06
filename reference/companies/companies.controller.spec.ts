import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './domain/company';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';

describe('CompaniesController', () => {
  let companiesController: CompaniesController;
  let companiesService: CompaniesService;

  const mockCompaniesService = {
    create: jest.fn((dto: CreateCompanyDto, files: Express.Multer.File[]) => {
      const logoUrl =
        files && files.length > 0
          ? 'https://s3.amazonaws.com/bucket/logo.png'
          : undefined;

      return Promise.resolve({
        id: 1,
        ...dto,
        ...(logoUrl && { logo: logoUrl }),
      });
    }),
    findManyBy: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id };
    }),
    update: jest.fn((id: string, dto: UpdateCompanyDto) => {
      return { id, ...dto };
    }),
    remove: jest.fn((id) => ({ id })),
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
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    companiesController = module.get<CompaniesController>(CompaniesController);
    companiesService = module.get<CompaniesService>(CompaniesService);
  });

  describe('create', () => {
    it('should create a company', async () => {
      const createCompanyDto: CreateCompanyDto = {
        company_name: 'Cody Web Development Inc.',
        short_name: 'Cody',
        tin: '123-456-789',
        is_main: false,
        address1: 'Cebu city',
        telephone: '1234567890',
        email: 'example@gmail.com',
        fiscal_year_start: new Date(),
        fiscal_year_end: new Date(),
        month_start: new Date(),
        month_end: new Date(),
        prev_month_start: new Date(),
        prev_month_end: new Date(),
        next_month_start: new Date(),
        next_month_end: new Date(),
        cycle_opening_backup: false,
        cycle_opening: false,
        cycle_closing: false,
        cycle_closing_backup: false,
        inventory_opening: false,
        inventory_closing: false,
      };

      const mockUser = {
        id: 1,
        username: 'sample-user',
        email: 'sample@cody.inc',
        first_name: 'Sample',
        last_name: 'User',
        email_verified: false,
        phone_verified: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockFile = {
        originalname: 'logo.png',
        mimetype: 'image/png',
        buffer: Buffer.from('mock file content'),
        size: 1024,
      } as Express.Multer.File;

      const result = await companiesController.create(
        createCompanyDto,
        mockFile,
        mockUser,
      );

      expect(result).toEqual({
        id: 1,
        ...createCompanyDto,
        logo: 'https://s3.amazonaws.com/bucket/logo.png',
      });

      expect(companiesService.create).toHaveBeenCalledWith(
        createCompanyDto,
        [mockFile],
        mockUser,
      );
    });
  });

  describe('findManyBy', () => {
    it('should return paginated companies', async () => {
      const query: Partial<BaseGetDto> = {
        take: 10,
        skip: 0,
      };
      const mockCompanies = [
        { id: 1, company_name: 'Company 1', short_name: 'C1' },
        { id: 2, company_name: 'Company 2', short_name: 'C2' },
      ];
      const totalResults = mockCompanies.length;

      mockCompaniesService.findManyBy.mockReturnValueOnce(
        Promise.resolve({
          data: mockCompanies,
          totalResults,
        }),
      );

      const result = await companiesController.findManyBy(query as BaseGetDto);

      expect(result).toEqual({
        data: mockCompanies,
        totalResults,
      });

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockCompanies);
      expect(companiesService.findManyBy).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return companies', async () => {
      const mockCompanies: Pick<Company, 'id'>[] = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockCompaniesService.findAll.mockResolvedValueOnce(mockCompanies);

      const result = await companiesController.findAll();

      expect(result).toEqual(mockCompanies);
      expect(mockCompaniesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a company by ID', async () => {
      const id = 1;
      const result = await companiesController.findById(id);
      expect(result).toEqual({ id });
      expect(companiesService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const id = 1;
      const updateCompanyDto: UpdateCompanyDto = {};
      const mockFile = {
        originalname: 'logo.png',
        mimetype: 'image/png',
        buffer: Buffer.from('mock file content'),
        size: 1024,
      } as Express.Multer.File;

      const mockUser = {
        id: 1,
        username: 'sample-user',
        email: 'sample@cody.inc',
        first_name: 'Sample',
        last_name: 'User',
        email_verified: false,
        phone_verified: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await companiesController.update(
        id,
        updateCompanyDto,
        mockFile,
        mockUser,
      );
      expect(result).toEqual({ id, ...updateCompanyDto });
      expect(companiesService.update).toHaveBeenCalledWith(
        id,
        updateCompanyDto,
        [mockFile],
        mockUser,
      );
    });
  });
});
