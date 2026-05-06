import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { BaseUserAddressRepository } from './persistence/base-user-address.repository';
import { UserAddress } from './domain/user-address';
import { User } from '@/users/domain/user';

describe('UserAddressesService', () => {
  let service: UserAddressesService;
  let repository: jest.Mocked<BaseUserAddressRepository>;

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    system_admin: false,
  } as User;

  const mockAddress: UserAddress = {
    id: 1,
    user_id: 1,
    label: 'Home',
    recipient_name: 'John Doe',
    phone: '+639123456789',
    address_line1: '123 Main Street',
    address_line2: 'Unit 4B',
    city: 'Manila',
    state_province: 'Metro Manila',
    postal_code: '1000',
    country: 'Philippines',
    is_default: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSecondAddress: UserAddress = {
    id: 2,
    user_id: 1,
    label: 'Work',
    recipient_name: 'John Doe',
    phone: '+639987654321',
    address_line1: '456 Business Ave',
    address_line2: null,
    city: 'Makati',
    state_province: 'Metro Manila',
    postal_code: '1200',
    country: 'Philippines',
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findAllByUserId: jest.fn(),
      findDefaultByUserId: jest.fn(),
      countByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      unsetDefaultForUser: jest.fn(),
      setAsDefault: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAddressesService,
        {
          provide: BaseUserAddressRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserAddressesService>(UserAddressesService);
    repository = module.get(BaseUserAddressRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      label: 'Home',
      recipient_name: 'John Doe',
      phone: '+639123456789',
      address_line1: '123 Main Street',
      address_line2: 'Unit 4B',
      city: 'Manila',
      state_province: 'Metro Manila',
      postal_code: '1000',
      country: 'Philippines',
    };

    it('should create first address and set it as default', async () => {
      repository.countByUserId.mockResolvedValue(0);
      repository.create.mockResolvedValue({ ...mockAddress, is_default: true });

      const result = await service.create(createDto, mockUser);

      expect(result.is_default).toBe(true);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          is_default: true,
        }),
      );
    });

    it('should create second address without default', async () => {
      repository.countByUserId.mockResolvedValue(1);
      repository.create.mockResolvedValue({
        ...mockSecondAddress,
        is_default: false,
      });

      const result = await service.create(
        { ...createDto, is_default: false },
        mockUser,
      );

      expect(result.is_default).toBe(false);
      expect(repository.unsetDefaultForUser).not.toHaveBeenCalled();
    });

    it('should unset previous default when creating with is_default true', async () => {
      repository.countByUserId.mockResolvedValue(1);
      repository.unsetDefaultForUser.mockResolvedValue(undefined);
      repository.create.mockResolvedValue({ ...mockAddress, is_default: true });

      await service.create({ ...createDto, is_default: true }, mockUser);

      expect(repository.unsetDefaultForUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should use default label "Shipping" when not provided', async () => {
      repository.countByUserId.mockResolvedValue(0);
      repository.create.mockResolvedValue(mockAddress);

      const dtoWithoutLabel: Omit<typeof createDto, 'label'> = {
        recipient_name: createDto.recipient_name,
        phone: createDto.phone,
        address_line1: createDto.address_line1,
        address_line2: createDto.address_line2,
        city: createDto.city,
        state_province: createDto.state_province,
        postal_code: createDto.postal_code,
        country: createDto.country,
      };
      await service.create(dtoWithoutLabel as any, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Shipping' }),
      );
    });

    it('should use default country "Philippines" when not provided', async () => {
      repository.countByUserId.mockResolvedValue(0);
      repository.create.mockResolvedValue(mockAddress);

      const dtoWithoutCountry: Omit<typeof createDto, 'country'> = {
        label: createDto.label,
        recipient_name: createDto.recipient_name,
        phone: createDto.phone,
        address_line1: createDto.address_line1,
        address_line2: createDto.address_line2,
        city: createDto.city,
        state_province: createDto.state_province,
        postal_code: createDto.postal_code,
      };
      await service.create(dtoWithoutCountry as any, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'Philippines' }),
      );
    });

    it('should throw UnprocessableEntityException when max addresses reached', async () => {
      repository.countByUserId.mockResolvedValue(10);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should set null for optional fields when not provided', async () => {
      repository.countByUserId.mockResolvedValue(0);
      repository.create.mockResolvedValue(mockAddress);

      const minimalDto = {
        recipient_name: 'John Doe',
        address_line1: '123 Main Street',
        city: 'Manila',
        state_province: 'Metro Manila',
        postal_code: '1000',
      };

      await service.create(minimalDto as any, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: null,
          address_line2: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all addresses for user', async () => {
      repository.findAllByUserId.mockResolvedValue([
        mockAddress,
        mockSecondAddress,
      ]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(2);
      expect(repository.findAllByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no addresses', async () => {
      repository.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return address for owner', async () => {
      repository.findByIdAndUserId.mockResolvedValue(mockAddress);

      const result = await service.findOne(1, mockUser);

      expect(result).toEqual(mockAddress);
      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('should throw NotFoundException if address not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.findOne(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if address belongs to different user', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      const otherUser = { ...mockUser, id: 999 };
      await expect(service.findOne(1, otherUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findDefault', () => {
    it('should return default address', async () => {
      repository.findDefaultByUserId.mockResolvedValue(mockAddress);

      const result = await service.findDefault(mockUser);

      expect(result).toEqual(mockAddress);
      expect(result?.is_default).toBe(true);
    });

    it('should return null if no default address', async () => {
      repository.findDefaultByUserId.mockResolvedValue(null);

      const result = await service.findDefault(mockUser);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto = {
      label: 'Updated Home',
      recipient_name: 'John Updated Doe',
    };

    beforeEach(() => {
      repository.findByIdAndUserId.mockResolvedValue(mockAddress);
      repository.update.mockResolvedValue({ ...mockAddress, ...updateDto });
    });

    it('should update address fields', async () => {
      const result = await service.update(1, updateDto, mockUser);

      expect(result.label).toBe('Updated Home');
      expect(result.recipient_name).toBe('John Updated Doe');
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining(updateDto),
      );
    });

    it('should unset previous default when setting is_default to true', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockSecondAddress,
        is_default: false,
      });
      repository.unsetDefaultForUser.mockResolvedValue(undefined);
      repository.update.mockResolvedValue({
        ...mockSecondAddress,
        is_default: true,
      });

      await service.update(2, { is_default: true }, mockUser);

      expect(repository.unsetDefaultForUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should NOT unset default if address is already default', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockAddress,
        is_default: true,
      });

      await service.update(1, { is_default: true }, mockUser);

      expect(repository.unsetDefaultForUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if address not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update(999, updateDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include updated_by in update data', async () => {
      await service.update(1, updateDto, mockUser);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          updated_by: {
            id: mockUser.id,
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
          },
        }),
      );
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      repository.findByIdAndUserId.mockResolvedValue(mockAddress);
      repository.softDelete.mockResolvedValue(undefined);
    });

    it('should soft delete address', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockSecondAddress,
        is_default: false,
      });

      await service.remove(2, mockUser);

      expect(repository.softDelete).toHaveBeenCalledWith(2, mockUser.id);
    });

    it('should promote another address to default when deleting default', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockAddress,
        is_default: true,
      });
      repository.findAllByUserId.mockResolvedValue([mockSecondAddress]);
      repository.setAsDefault.mockResolvedValue({
        ...mockSecondAddress,
        is_default: true,
      });

      await service.remove(1, mockUser);

      expect(repository.setAsDefault).toHaveBeenCalledWith(
        mockSecondAddress.id,
        mockUser.id,
      );
    });

    it('should NOT promote if no remaining addresses', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockAddress,
        is_default: true,
      });
      repository.findAllByUserId.mockResolvedValue([]);

      await service.remove(1, mockUser);

      expect(repository.setAsDefault).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if address not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.remove(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setAsDefault', () => {
    beforeEach(() => {
      repository.findByIdAndUserId.mockResolvedValue(mockSecondAddress);
      repository.setAsDefault.mockResolvedValue({
        ...mockSecondAddress,
        is_default: true,
      });
    });

    it('should set address as default', async () => {
      const result = await service.setAsDefault(2, mockUser);

      expect(result.is_default).toBe(true);
      expect(repository.setAsDefault).toHaveBeenCalledWith(2, mockUser.id);
    });

    it('should return address if already default without calling setAsDefault', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockAddress,
        is_default: true,
      });

      const result = await service.setAsDefault(1, mockUser);

      expect(result.is_default).toBe(true);
      expect(repository.setAsDefault).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if address not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.setAsDefault(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAddressForCheckout', () => {
    it('should return address for checkout', async () => {
      repository.findByIdAndUserId.mockResolvedValue(mockAddress);

      const result = await service.getAddressForCheckout(1, mockUser.id);

      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getAddressForCheckout(999, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if address belongs to different user', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getAddressForCheckout(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDefaultAddressForCheckout', () => {
    it('should return default address for checkout', async () => {
      repository.findDefaultByUserId.mockResolvedValue(mockAddress);

      const result = await service.getDefaultAddressForCheckout(mockUser.id);

      expect(result).toEqual(mockAddress);
    });

    it('should throw UnprocessableEntityException if no default address', async () => {
      repository.findDefaultByUserId.mockResolvedValue(null);

      await expect(
        service.getDefaultAddressForCheckout(mockUser.id),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
