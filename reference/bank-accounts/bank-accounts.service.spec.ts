import { BankAccountsService } from '@/bank-accounts/bank-accounts.service';
import {
  BankAccount,
  BankAccountStatusEnum,
  BankAccountTypeEnum,
} from '@/bank-accounts/domain/bank-account';
import { User } from '@/users/domain/user';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('BankAccountsService', () => {
  let service: BankAccountsService;
  let repo: any;
  let encryptionService: any;

  const mockUser: Partial<User> = {
    id: 1,
    first_name: 'Juan',
    last_name: 'Cruz',
  };

  const mockBankAccount: BankAccount = {
    id: 1,
    user_id: 1,
    bank_id: 5,
    account_holder_name: 'Juan Dela Cruz',
    last_four: '1234',
    account_type: BankAccountTypeEnum.SAVINGS,
    is_default: false,
    status: BankAccountStatusEnum.UNVERIFIED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    repo = {
      findDuplicateAccount: jest.fn(),
      clearDefaults: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findByIdAndUserId: jest.fn(),
      setDefault: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    encryptionService = {
      encrypt: jest.fn().mockReturnValue('encrypted-account-number'),
    };

    service = new BankAccountsService(repo, encryptionService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      account_holder_name: 'Juan Dela Cruz',
      account_number: '0001111234',
      bank_id: 5,
    };

    it('should throw ConflictException when duplicate account exists', async () => {
      repo.findDuplicateAccount.mockResolvedValue(mockBankAccount);
      await expect(service.create(createDto, mockUser as User)).rejects.toThrow(
        new ConflictException('This bank account is already saved'),
      );
      expect(repo.findDuplicateAccount).toHaveBeenCalledWith(1, 5, '1234');
    });

    it('should encrypt account number before saving', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(createDto, mockUser as User);
      expect(encryptionService.encrypt).toHaveBeenCalledWith(
        createDto.account_number,
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.any(Object),
        'encrypted-account-number',
      );
    });

    it('should clear defaults before creating when is_default is true', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(
        { ...createDto, is_default: true },
        mockUser as User,
      );
      expect(repo.clearDefaults).toHaveBeenCalledWith(1);
    });

    it('should not clear defaults when is_default is false', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(
        { ...createDto, is_default: false },
        mockUser as User,
      );
      expect(repo.clearDefaults).not.toHaveBeenCalled();
    });

    it('should extract last 4 digits of account number', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(createDto, mockUser as User);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ last_four: '1234' }),
        expect.any(String),
      );
    });

    it('should default is_default to false when not provided', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(createDto, mockUser as User);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_default: false }),
        expect.any(String),
      );
    });

    it('should set status to UNVERIFIED', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      await service.create(createDto, mockUser as User);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: BankAccountStatusEnum.UNVERIFIED }),
        expect.any(String),
      );
    });

    it('should return the created bank account', async () => {
      repo.findDuplicateAccount.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBankAccount);
      const result = await service.create(createDto, mockUser as User);
      expect(result).toEqual(mockBankAccount);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should pass user_id and defaults to repository', async () => {
      const mockResult = {
        data: [mockBankAccount],
        totalCount: 1,
        skip: 0,
        take: 20,
      };
      repo.findAll.mockResolvedValue(mockResult);
      const result = await service.findAll({}, mockUser as User);
      expect(result).toEqual(mockResult);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          skip: 0,
          take: 20,
          sortBy: 'DESC',
        }),
      );
    });

    it('should forward filters from query', async () => {
      repo.findAll.mockResolvedValue({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 10,
      });
      await service.findAll(
        {
          status: BankAccountStatusEnum.ACTIVE,
          is_default: true,
          take: 10,
          skip: 5,
        },
        mockUser as User,
      );
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BankAccountStatusEnum.ACTIVE,
          is_default: true,
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return bank account when found', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockBankAccount);
      const result = await service.findById(1, mockUser as User);
      expect(result).toEqual(mockBankAccount);
      expect(repo.findByIdAndUserId).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);
      await expect(service.findById(999, mockUser as User)).rejects.toThrow(
        new NotFoundException('Bank account not found'),
      );
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when bank account not owned by user', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);
      await expect(
        service.update(
          999,
          { account_holder_name: 'New Name' },
          mockUser as User,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call setDefault when is_default is true', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockBankAccount);
      repo.update.mockResolvedValue({ ...mockBankAccount, is_default: true });
      await service.update(1, { is_default: true }, mockUser as User);
      expect(repo.setDefault).toHaveBeenCalledWith(mockBankAccount.id, 1);
    });

    it('should not call setDefault when is_default is false', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockBankAccount);
      repo.update.mockResolvedValue(mockBankAccount);
      await service.update(1, { is_default: false }, mockUser as User);
      expect(repo.setDefault).not.toHaveBeenCalled();
    });

    it('should return updated bank account', async () => {
      const updated = { ...mockBankAccount, account_holder_name: 'New Name' };
      repo.findByIdAndUserId.mockResolvedValue(mockBankAccount);
      repo.update.mockResolvedValue(updated);
      const result = await service.update(
        1,
        { account_holder_name: 'New Name' },
        mockUser as User,
      );
      expect(result).toEqual(updated);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException when bank account not found', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);
      await expect(service.remove(999, mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call repo.remove after verifying ownership', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockBankAccount);
      repo.remove.mockResolvedValue(undefined);
      await service.remove(1, mockUser as User);
      expect(repo.remove).toHaveBeenCalledWith(1);
    });
  });
});
