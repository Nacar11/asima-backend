import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { User } from '@/users/domain/user';
import {
  BankAccount,
  BankAccountStatusEnum,
  BankAccountTypeEnum,
} from './domain/bank-account';
import { FindAllBankAccount } from './domain/find-all-bank-account';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('BankAccountsController', () => {
  let controller: BankAccountsController;
  let service: BankAccountsService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  } as User;

  const mockBankAccount: BankAccount = {
    id: 1,
    user_id: 1,
    bank_id: 1,
    account_holder_name: 'Juan Dela Cruz',
    last_four: '8904',
    account_type: BankAccountTypeEnum.SAVINGS,
    is_default: false,
    status: BankAccountStatusEnum.UNVERIFIED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllResult: FindAllBankAccount = {
    data: [mockBankAccount],
    totalCount: 1,
    skip: 0,
    take: 20,
  };

  const mockBankAccountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankAccountsController],
      providers: [
        {
          provide: BankAccountsService,
          useValue: mockBankAccountsService,
        },
      ],
    }).compile();

    controller = module.get<BankAccountsController>(BankAccountsController);
    service = module.get<BankAccountsService>(BankAccountsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      mockBankAccountsService.create.mockResolvedValue(mockBankAccount);

      const result = await controller.create(
        {
          account_holder_name: 'Juan Dela Cruz',
          account_number: '1234567890',
          bank_id: 1,
        },
        mockUser,
      );

      expect(result).toEqual(mockBankAccount);
      expect(service.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when duplicate account', async () => {
      mockBankAccountsService.create.mockRejectedValue(
        new ConflictException('This bank account is already saved'),
      );

      await expect(
        controller.create(
          {
            account_holder_name: 'Juan Dela Cruz',
            account_number: '1234567890',
            bank_id: 1,
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of bank accounts', async () => {
      mockBankAccountsService.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll({}, mockUser);

      expect(result).toEqual(mockFindAllResult);
      expect(service.findAll).toHaveBeenCalledWith({}, mockUser);
    });
  });

  describe('findById', () => {
    it('should return bank account by ID', async () => {
      mockBankAccountsService.findById.mockResolvedValue(mockBankAccount);

      const result = await controller.findById(1, mockUser);

      expect(result).toEqual(mockBankAccount);
      expect(service.findById).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when bank account not found', async () => {
      mockBankAccountsService.findById.mockRejectedValue(
        new NotFoundException('Bank account not found'),
      );

      await expect(controller.findById(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update bank account', async () => {
      const updatedAccount = { ...mockBankAccount, is_default: true };
      mockBankAccountsService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(1, { is_default: true }, mockUser);

      expect(result).toEqual(updatedAccount);
      expect(service.update).toHaveBeenCalledWith(
        1,
        { is_default: true },
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete bank account', async () => {
      mockBankAccountsService.remove.mockResolvedValue(undefined);

      await controller.remove(1, mockUser);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when bank account not found', async () => {
      mockBankAccountsService.remove.mockRejectedValue(
        new NotFoundException('Bank account not found'),
      );

      await expect(controller.remove(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
