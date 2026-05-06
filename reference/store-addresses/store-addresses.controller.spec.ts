import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { StoreAddressesController } from './store-addresses.controller';
import { StoreAddressesService } from './store-addresses.service';
import { StoreAddress } from './domain/store-address';
import { User } from '@/users/domain/user';

const mockAddress: StoreAddress = {
  id: 1,
  seller_id: 10,
  label: 'Main Branch',
  address_line: '123 Test St',
  province: 'Cebu',
  city: 'Cebu City',
  barangay: 'Capitol Site',
  postal_code: '6000',
  latitude: 10.312,
  longitude: 123.893,
  is_default: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const currentUser: User = {
  id: 1,
  first_name: 'Test',
  last_name: 'Seller',
  email: 'seller@test.com',
  system_admin: false,
  seller: { id: 10 },
} as unknown as User;

describe('StoreAddressesController', () => {
  let controller: StoreAddressesController;
  let service: jest.Mocked<StoreAddressesService>;

  const mockService: jest.Mocked<Partial<StoreAddressesService>> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setAsDefault: jest.fn(),
  };

  const jwtGuardMock = {
    canActivate: jest.fn().mockImplementation((ctx: ExecutionContext) => {
      ctx.switchToHttp().getRequest().user = currentUser;
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreAddressesController],
      providers: [{ provide: StoreAddressesService, useValue: mockService }],
    })
      .overrideGuard(JwtGuard)
      .useValue(jwtGuardMock)
      .compile();

    controller = module.get(StoreAddressesController);
    service = module.get(StoreAddressesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should delegate to service with dto and currentUser', async () => {
      service.create.mockResolvedValue(mockAddress);
      const dto = { label: 'Main Branch', city: 'Cebu City' };

      const result = await controller.create(dto as any, currentUser);

      expect(service.create).toHaveBeenCalledWith(dto, currentUser);
      expect(result).toBe(mockAddress);
    });
  });

  describe('findAll', () => {
    it('should delegate query to service', async () => {
      const response = { data: [mockAddress], total: 1 };
      service.findAll.mockResolvedValue(response);
      const query = { seller_id: 10, skip: 0, take: 20 };

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(response);
    });
  });

  describe('findOne', () => {
    it('should pass id and currentUser to service', async () => {
      service.findOne.mockResolvedValue(mockAddress);

      const result = await controller.findOne(1, currentUser);

      expect(service.findOne).toHaveBeenCalledWith(1, currentUser);
      expect(result).toBe(mockAddress);
    });
  });

  describe('update', () => {
    it('should pass id, dto, and currentUser to service', async () => {
      const updated = { ...mockAddress, label: 'Updated' };
      service.update.mockResolvedValue(updated);
      const dto = { label: 'Updated' };

      const result = await controller.update(1, dto as any, currentUser);

      expect(service.update).toHaveBeenCalledWith(1, dto, currentUser);
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('should pass id and currentUser to service', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1, currentUser);

      expect(service.remove).toHaveBeenCalledWith(1, currentUser);
    });
  });

  describe('setAsDefault', () => {
    it('should pass id and currentUser to service', async () => {
      service.setAsDefault.mockResolvedValue(mockAddress);

      const result = await controller.setAsDefault(1, currentUser);

      expect(service.setAsDefault).toHaveBeenCalledWith(1, currentUser);
      expect(result).toBe(mockAddress);
    });
  });
});
