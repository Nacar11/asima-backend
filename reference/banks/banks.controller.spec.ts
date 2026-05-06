import { Test, TestingModule } from '@nestjs/testing';
import { BanksController } from '@/banks/banks.controller';
import { BanksService } from '@/banks/banks.service';
import { Bank } from '@/banks/domain/bank';
import { FindAllBank } from '@/banks/domain/find-all-bank';
import { CreateBankDto } from '@/banks/dto/create-bank.dto';
import { UpdateBankDto } from '@/banks/dto/update-bank.dto';
import { QueryBankDto } from '@/banks/dto/query-bank.dto';
import { User } from '@/users/domain/user';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('BanksController', () => {
  let controller: BanksController;
  let service: BanksService;

  const mockUser: User = {
    id: 1,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
  } as User;

  const mockBank: Bank = {
    id: 1,
    bank_code: 'BPI',
    bank_name: 'Bank of the Philippine Islands',
    logo_url: 'https://example.com/bpi.png',
    is_active: true,
    display_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: { id: 1, first_name: 'Admin', last_name: 'User' },
    updated_by: { id: 1, first_name: 'Admin', last_name: 'User' },
  };

  const mockFindAllBank: FindAllBank = {
    data: [mockBank],
    totalCount: 1,
    skip: 0,
    take: 20,
  };

  const mockBanksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findActiveBanks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BanksController],
      providers: [
        {
          provide: BanksService,
          useValue: mockBanksService,
        },
      ],
    }).compile();

    controller = module.get<BanksController>(BanksController);
    service = module.get<BanksService>(BanksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bank', async () => {
      const input: CreateBankDto = {
        bank_code: 'BPI',
        bank_name: 'Bank of the Philippine Islands',
        logo_url: 'https://example.com/bpi.png',
        is_active: true,
        display_order: 1,
      };
      mockBanksService.create.mockResolvedValue(mockBank);
      const result = await controller.create(input, mockUser);
      expect(result).toEqual(mockBank);
      expect(service.create).toHaveBeenCalledWith(input, mockUser);
    });

    it('should throw ConflictException when bank code already exists', async () => {
      const input: CreateBankDto = {
        bank_code: 'BPI',
        bank_name: 'Bank of the Philippine Islands',
      };
      mockBanksService.create.mockRejectedValue(
        new ConflictException('Bank with code BPI already exists'),
      );
      await expect(controller.create(input, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of banks', async () => {
      const query: QueryBankDto = { skip: 0, take: 20 };
      mockBanksService.findAll.mockResolvedValue(mockFindAllBank);
      const result = await controller.findAll(query);
      expect(result).toEqual(mockFindAllBank);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findActiveBanks', () => {
    it('should return list of active banks', async () => {
      mockBanksService.findActiveBanks.mockResolvedValue([mockBank]);
      const result = await controller.findActiveBanks();
      expect(result).toEqual([mockBank]);
      expect(service.findActiveBanks).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return bank by ID', async () => {
      mockBanksService.findById.mockResolvedValue(mockBank);
      const result = await controller.findById(1);
      expect(result).toEqual(mockBank);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when bank not found', async () => {
      mockBanksService.findById.mockRejectedValue(
        new NotFoundException('Bank with id 999 not found'),
      );
      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update bank', async () => {
      const input: UpdateBankDto = {
        bank_name: 'Updated Bank Name',
      };
      const updatedBank = { ...mockBank, bank_name: 'Updated Bank Name' };
      mockBanksService.update.mockResolvedValue(updatedBank);
      const result = await controller.update(1, input, mockUser);
      expect(result).toEqual(updatedBank);
      expect(service.update).toHaveBeenCalledWith(1, input, mockUser);
    });

    it('should throw NotFoundException when bank not found', async () => {
      const input: UpdateBankDto = { bank_name: 'Updated' };
      mockBanksService.update.mockRejectedValue(
        new NotFoundException('Bank with id 999 not found'),
      );
      await expect(controller.update(999, input, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete bank', async () => {
      mockBanksService.remove.mockResolvedValue(undefined);
      await controller.delete(1);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when bank not found', async () => {
      mockBanksService.remove.mockRejectedValue(
        new NotFoundException('Bank with id 999 not found'),
      );
      await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
