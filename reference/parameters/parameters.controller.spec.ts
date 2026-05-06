import { Test, TestingModule } from '@nestjs/testing';
import { ParametersController as parametersController } from './parameters.controller';
import { ParametersService as parametersService } from './parameters.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { Parameter } from './domain/parameter';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

describe('parametersController', () => {
  let ParametersController: parametersController;
  let ParametersService: parametersService;

  const mockparametersService = {
    create: jest.fn((dto: CreateParameterDto) => {
      return { id: 1, ...dto }; // Mock parameters return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findByMany: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock parameters return
    }),
    update: jest.fn((id: string, dto: UpdateParameterDto) => {
      return { id, ...dto }; // Mock updated parameters return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted parameters return
    findByCode: jest.fn((code: string) => {
      return {
        id: 1,
        code,
        description: 'Test parameter',
        param_items: 'test item',
        string_value: 'String',
        numeric_value: 100,
        boolean_value: true,
        date_value: '2025-06-25',
      }; // Mock parameters return by code
    }),
    findByItem: jest.fn((param_item: string) => {
      return { param_item }; // Mock parameters return by item
    }),
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
      controllers: [parametersController],
      providers: [
        {
          provide: parametersService,
          useValue: mockparametersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    ParametersController =
      module.get<parametersController>(parametersController);
    ParametersService = module.get<parametersService>(parametersService);
  });

  describe('create', () => {
    it('should create a parameters', async () => {
      const createparametersDto: CreateParameterDto = {
        code: 'TST001',
        param_items: 'param item',
        description: 'param desc',
        string_value: 'param string value',
        numeric_value: 100.0,
        boolean_value: true,
        date_value: new Date('2025-06-26'),
      };
      const result = await ParametersController.create(createparametersDto);
      expect(result).toEqual({ id: 1, ...createparametersDto });
      expect(ParametersService.create).toHaveBeenCalledWith(
        createparametersDto,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated parameters', async () => {
      const query = { skip: 0, take: 20 } as GetQueryParams;

      // Mocking the return value of the parametersService.findAllWithPagination
      const mockparameters: Pick<
        Parameter,
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
      ]; // Example parameters data

      const totalCount = 2; // Total results mock

      mockparametersService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockparameters,
          totalCount,
        }),
      );

      const result: { data: Parameter[]; totalCount: number } =
        await ParametersController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockparameters);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that parametersService.findAllWithPagination was called with the correct parameters
      expect(ParametersService.findByMany).toHaveBeenCalledWith({
        ...query,
        sort: query.sort,
      });
    });
  });

  describe('findAll', () => {
    it('should return parameters', async () => {
      const mockparameters: Pick<Parameter, 'id'>[] = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockparametersService.findAll.mockResolvedValueOnce(mockparameters);

      const result = await ParametersController.findAll();

      expect(result).toEqual(mockparameters);
      expect(mockparametersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a parameters by ID', async () => {
      const id = 1;
      const result = await ParametersController.findById(id);
      expect(result).toEqual({ id });
      expect(ParametersService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a parameters', async () => {
      const id = 1;
      const updateparametersDto: UpdateParameterDto = {};
      const result = await ParametersController.update(id, updateparametersDto);
      expect(result).toEqual({ id, ...updateparametersDto });
      expect(ParametersService.update).toHaveBeenCalledWith(
        id,
        updateparametersDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a parameters', async () => {
      const id = 1;
      await ParametersController.remove(id);
      expect(ParametersService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('findbyCode', () => {
    it('should return a parameter by code', async () => {
      const mockParameter = {
        id: 1,
        code: 'TST001',
        description: 'Test parameter',
        param_items: 'test item',
        string_value: 'String',
        numeric_value: 100,
        boolean_value: true,
        date_value: '2025-06-25',
      };
      const code = 'TST001';
      const result = await ParametersController.findByCode({ code });
      expect(result).toEqual(mockParameter);
      expect(ParametersService.findByCode).toHaveBeenCalledWith(code);
    });
  });

  describe('findbyItem', () => {
    it('should return a parameters by item', async () => {
      const param_item = 'param item';
      const result = await ParametersController.findByItem({ param_item });
      expect(result).toEqual({ param_item });
      expect(ParametersService.findByItem).toHaveBeenCalledWith(param_item);
    });
  });
});
