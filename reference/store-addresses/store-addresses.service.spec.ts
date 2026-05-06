import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoreAddressesService } from './store-addresses.service';
import { BaseStoreAddressRepository } from './persistence/base-store-address.repository';
import { StoreAddress } from './domain/store-address';
import { User } from '@/users/domain/user';

const mockAddress = (overrides: Partial<StoreAddress> = {}): StoreAddress =>
  ({
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
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as StoreAddress;

const sellerUser = (sellerId: number, isAdmin = false): User =>
  ({
    id: 1,
    first_name: 'Test',
    last_name: 'Seller',
    email: 'seller@test.com',
    system_admin: isAdmin,
    seller: isAdmin ? undefined : { id: sellerId },
  }) as unknown as User;

const regularUser: User = {
  id: 99,
  first_name: 'Regular',
  last_name: 'User',
  email: 'user@test.com',
  system_admin: false,
} as User;

const adminUser: User = {
  id: 100,
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@test.com',
  system_admin: true,
} as User;

describe('StoreAddressesService', () => {
  let service: StoreAddressesService;
  let repo: jest.Mocked<BaseStoreAddressRepository>;

  beforeEach(async () => {
    const mockRepo: jest.Mocked<BaseStoreAddressRepository> = {
      findById: jest.fn(),
      findAllBySellerId: jest.fn(),
      findDefaultBySellerId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      softDeleteAndPromoteDefault: jest.fn(),
      unsetDefaultForSeller: jest.fn(),
      setAsDefault: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreAddressesService,
        { provide: BaseStoreAddressRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(StoreAddressesService);
    repo = module.get(BaseStoreAddressRepository);
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should throw 403 when user has no seller account', async () => {
      await expect(service.create({}, regularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create address and set seller_id from JWT, not body', async () => {
      const owner = sellerUser(10);
      const created = mockAddress({ seller_id: 10, is_default: true });
      repo.findAllBySellerId.mockResolvedValue({ data: [], total: 0 });
      repo.create.mockResolvedValue(created);

      const result = await service.create({ label: 'Main Branch' }, owner);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ seller_id: 10 }),
      );
      expect(result.seller_id).toBe(10);
    });

    it('should set first address as default regardless of is_default flag', async () => {
      const owner = sellerUser(10);
      repo.findAllBySellerId.mockResolvedValue({ data: [], total: 0 });
      repo.create.mockResolvedValue(mockAddress({ is_default: true }));

      await service.create({ is_default: false }, owner);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_default: true }),
      );
    });

    it('should unset previous default when creating a new default address', async () => {
      const owner = sellerUser(10);
      const existing = mockAddress({ is_default: true });
      repo.findAllBySellerId.mockResolvedValue({ data: [existing], total: 1 });
      repo.create.mockResolvedValue(mockAddress({ is_default: true }));

      await service.create({ is_default: true }, owner);

      expect(repo.unsetDefaultForSeller).toHaveBeenCalledWith(10);
    });

    it('should not unset default when new address is not default', async () => {
      const owner = sellerUser(10);
      const existing = mockAddress({ is_default: true });
      repo.findAllBySellerId.mockResolvedValue({ data: [existing], total: 1 });
      repo.create.mockResolvedValue(mockAddress({ is_default: false }));

      await service.create({ is_default: false }, owner);

      expect(repo.unsetDefaultForSeller).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw 404 when address does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne(1, sellerUser(10))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not a seller', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.findOne(1, regularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw 403 when seller does not own the address', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.findOne(1, sellerUser(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return address when owner requests it', async () => {
      const address = mockAddress({ seller_id: 10 });
      repo.findById.mockResolvedValue(address);

      const result = await service.findOne(1, sellerUser(10));
      expect(result).toBe(address);
    });

    it('should allow system admin to read any address', async () => {
      const address = mockAddress({ seller_id: 10 });
      repo.findById.mockResolvedValue(address);

      const result = await service.findOne(1, adminUser);
      expect(result).toBe(address);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw 404 when address does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update(1, {}, sellerUser(10))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not a seller', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.update(1, {}, regularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw 403 when seller does not own the address', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.update(1, {}, sellerUser(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should unset previous default when promoting a new one', async () => {
      const existing = mockAddress({ seller_id: 10, is_default: false });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue({ ...existing, is_default: true });

      await service.update(1, { is_default: true }, sellerUser(10));

      expect(repo.unsetDefaultForSeller).toHaveBeenCalledWith(10);
    });

    it('should not call unsetDefault when address is already default', async () => {
      const existing = mockAddress({ seller_id: 10, is_default: true });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(existing);

      await service.update(1, { is_default: true }, sellerUser(10));

      expect(repo.unsetDefaultForSeller).not.toHaveBeenCalled();
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw 404 when address does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove(1, sellerUser(10))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not a seller', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.remove(1, regularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw 403 when seller does not own the address', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.remove(1, sellerUser(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should use atomic softDeleteAndPromoteDefault when deleting the default address', async () => {
      const address = mockAddress({ seller_id: 10, is_default: true });
      repo.findById.mockResolvedValue(address);
      repo.softDeleteAndPromoteDefault.mockResolvedValue(undefined);

      await service.remove(1, sellerUser(10));

      expect(repo.softDeleteAndPromoteDefault).toHaveBeenCalledWith(1, 10, 1);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('should use simple softDelete when deleting a non-default address', async () => {
      const address = mockAddress({ seller_id: 10, is_default: false });
      repo.findById.mockResolvedValue(address);
      repo.softDelete.mockResolvedValue(undefined);

      await service.remove(1, sellerUser(10));

      expect(repo.softDelete).toHaveBeenCalledWith(1, 1);
      expect(repo.softDeleteAndPromoteDefault).not.toHaveBeenCalled();
    });
  });

  // ─── setAsDefault ──────────────────────────────────────────────────────────

  describe('setAsDefault', () => {
    it('should throw 404 when address does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.setAsDefault(1, sellerUser(10))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when seller does not own the address', async () => {
      repo.findById.mockResolvedValue(mockAddress({ seller_id: 10 }));
      await expect(service.setAsDefault(1, sellerUser(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return existing address without DB call when already default', async () => {
      const address = mockAddress({ seller_id: 10, is_default: true });
      repo.findById.mockResolvedValue(address);

      const result = await service.setAsDefault(1, sellerUser(10));

      expect(repo.setAsDefault).not.toHaveBeenCalled();
      expect(result).toBe(address);
    });

    it('should call setAsDefault in repo when address is not yet default', async () => {
      const address = mockAddress({ seller_id: 10, is_default: false });
      const updated = { ...address, is_default: true };
      repo.findById.mockResolvedValue(address);
      repo.setAsDefault.mockResolvedValue(updated);

      const result = await service.setAsDefault(1, sellerUser(10));

      expect(repo.setAsDefault).toHaveBeenCalledWith(1, 10);
      expect(result.is_default).toBe(true);
    });
  });
});
