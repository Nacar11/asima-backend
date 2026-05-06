import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ReferralCodesService } from '@/referral-codes/referral-codes.service';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';
import { VouchersService } from '@/vouchers/vouchers.service';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';
import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';
import { User } from '@/users/domain/user';

function makeCode(overrides: Partial<ReferralCode> = {}): ReferralCode {
  const code = new ReferralCode();
  code.id = 1;
  code.code = 'TESTCODE';
  code.status = ReferralCodeStatusEnum.ACTIVE;
  code.usage_count = 0;
  code.usage_limit = null;
  code.expires_at = null;
  code.selection_mode = ReferralCodeSelectionModeEnum.AUTO_ASSIGN;
  code.max_voucher_selections = null;
  code.selection_timeout_hours = null;
  code.voucher_ids = [10, 20];
  code.description = null;
  code.created_by = null;
  code.updated_by = null;
  code.deleted_by = null;
  code.created_at = new Date();
  code.updated_at = new Date();
  code.deleted_at = null;
  return Object.assign(code, overrides);
}

function makeUsage(overrides: Partial<ReferralCodeUsage> = {}): ReferralCodeUsage {
  const usage = new ReferralCodeUsage();
  usage.id = 100;
  usage.referral_code_id = 1;
  usage.user_id = 5;
  usage.selection_status = ReferralCodeUsageSelectionStatusEnum.PENDING;
  usage.selection_deadline = null;
  usage.created_at = new Date();
  return Object.assign(usage, overrides);
}

function makeUser(): User {
  const u = new User();
  u.id = 5;
  return u;
}

describe('ReferralCodesService', () => {
  let service: ReferralCodesService;
  let rcRepo: jest.Mocked<BaseReferralCodeRepository>;
  let usageRepo: jest.Mocked<BaseReferralCodeUsageRepository>;
  let selectionRepo: jest.Mocked<BaseReferralCodeUsageSelectionRepository>;
  let vouchersService: jest.Mocked<Pick<VouchersService, 'giftVoucherToUser' | 'findById'>>;

  beforeEach(async () => {
    rcRepo = {
      findByCode: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      incrementUsage: jest.fn(),
      saveVoucherLinks: jest.fn(),
    } as unknown as jest.Mocked<BaseReferralCodeRepository>;

    usageRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByReferralCodeId: jest.fn(),
      findOverdueSelections: jest.fn(),
      create: jest.fn(),
      updateSelectionStatus: jest.fn(),
    } as unknown as jest.Mocked<BaseReferralCodeUsageRepository>;

    selectionRepo = {
      createBulk: jest.fn(),
    } as unknown as jest.Mocked<BaseReferralCodeUsageSelectionRepository>;

    vouchersService = {
      giftVoucherToUser: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCodesService,
        { provide: BaseReferralCodeRepository, useValue: rcRepo },
        { provide: BaseReferralCodeUsageRepository, useValue: usageRepo },
        { provide: BaseReferralCodeUsageSelectionRepository, useValue: selectionRepo },
        { provide: VouchersService, useValue: vouchersService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') } },
        // null triggers @Transaction() gracefulFallback — runs method without a DB transaction in tests
        { provide: DataSource, useValue: null },
      ],
    }).compile();

    service = module.get<ReferralCodesService>(ReferralCodesService);
  });

  // ─── applyReferralCode ───────────────────────────────────────────────────────

  describe('applyReferralCode', () => {
    it('auto_assign with vouchers — gifts all vouchers immediately, returns selectionPending=false', async () => {
      const code = makeCode({ voucher_ids: [10, 20] });
      const usage = makeUsage({ selection_status: ReferralCodeUsageSelectionStatusEnum.NOT_APPLICABLE });
      rcRepo.findByCode.mockResolvedValue(code);
      rcRepo.incrementUsage.mockResolvedValue();
      usageRepo.create.mockResolvedValue(usage);
      vouchersService.giftVoucherToUser.mockResolvedValue();

      const result = await service.applyReferralCode('TESTCODE', makeUser());

      expect(rcRepo.incrementUsage).toHaveBeenCalledWith(1, undefined);
      expect(usageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          selection_status: ReferralCodeUsageSelectionStatusEnum.NOT_APPLICABLE,
        }),
        undefined,
      );
      expect(vouchersService.giftVoucherToUser).toHaveBeenCalledTimes(2);
      expect(result.selectionPending).toBe(false);
      expect(result.usageId).toBe(100);
    });

    it('auto_assign with no vouchers — no gifting, returns selectionPending=false', async () => {
      const code = makeCode({ voucher_ids: [] });
      usageRepo.create.mockResolvedValue(makeUsage({ selection_status: ReferralCodeUsageSelectionStatusEnum.NOT_APPLICABLE }));
      rcRepo.findByCode.mockResolvedValue(code);
      rcRepo.incrementUsage.mockResolvedValue();

      const result = await service.applyReferralCode('TESTCODE', makeUser());

      expect(vouchersService.giftVoucherToUser).not.toHaveBeenCalled();
      expect(result.selectionPending).toBe(false);
    });

    it('user_selection with vouchers — no gifting at registration, returns selectionPending=true', async () => {
      const code = makeCode({
        selection_mode: ReferralCodeSelectionModeEnum.USER_SELECTION,
        max_voucher_selections: 1,
        voucher_ids: [10],
      });
      const usage = makeUsage({ selection_status: ReferralCodeUsageSelectionStatusEnum.PENDING });
      rcRepo.findByCode.mockResolvedValue(code);
      rcRepo.incrementUsage.mockResolvedValue();
      usageRepo.create.mockResolvedValue(usage);

      const result = await service.applyReferralCode('TESTCODE', makeUser());

      expect(vouchersService.giftVoucherToUser).not.toHaveBeenCalled();
      expect(usageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          selection_status: ReferralCodeUsageSelectionStatusEnum.PENDING,
        }),
        undefined,
      );
      expect(result.selectionPending).toBe(true);
    });

    it('inactive code — throws UnprocessableEntityException without creating user', async () => {
      const code = makeCode({ status: ReferralCodeStatusEnum.INACTIVE });
      rcRepo.findByCode.mockResolvedValue(code);

      await expect(service.applyReferralCode('TESTCODE', makeUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(rcRepo.incrementUsage).not.toHaveBeenCalled();
    });

    it('expired code — throws UnprocessableEntityException', async () => {
      const code = makeCode({ expires_at: new Date('2000-01-01') });
      rcRepo.findByCode.mockResolvedValue(code);

      await expect(service.applyReferralCode('TESTCODE', makeUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('usage_limit reached — throws UnprocessableEntityException', async () => {
      const code = makeCode({ usage_limit: 5, usage_count: 5 });
      rcRepo.findByCode.mockResolvedValue(code);

      await expect(service.applyReferralCode('TESTCODE', makeUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── selectVouchers ──────────────────────────────────────────────────────────

  describe('selectVouchers', () => {
    const user = makeUser();

    it('valid selection — gifts voucher and sets status to completed', async () => {
      const code = makeCode({ max_voucher_selections: 2, voucher_ids: [10, 20] });
      const usage = makeUsage({ selection_status: ReferralCodeUsageSelectionStatusEnum.PENDING });
      usageRepo.findById.mockResolvedValue(usage);
      rcRepo.findById.mockResolvedValue(code);
      vouchersService.findById.mockResolvedValue({ id: 10, expires_at: null } as any);
      vouchersService.giftVoucherToUser.mockResolvedValue();
      selectionRepo.createBulk.mockResolvedValue();
      usageRepo.updateSelectionStatus.mockResolvedValue();

      await service.selectVouchers(100, [10], user);

      expect(vouchersService.giftVoucherToUser).toHaveBeenCalledWith(10, user.id);
      expect(usageRepo.updateSelectionStatus).toHaveBeenCalledWith(
        100,
        ReferralCodeUsageSelectionStatusEnum.COMPLETED,
      );
    });

    it('count exceeds max_voucher_selections — throws', async () => {
      const code = makeCode({ max_voucher_selections: 1, voucher_ids: [10, 20] });
      usageRepo.findById.mockResolvedValue(makeUsage());
      rcRepo.findById.mockResolvedValue(code);

      await expect(service.selectVouchers(100, [10, 20], user)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('expired voucher — throws', async () => {
      const code = makeCode({ max_voucher_selections: 1, voucher_ids: [10] });
      usageRepo.findById.mockResolvedValue(makeUsage());
      rcRepo.findById.mockResolvedValue(code);
      vouchersService.findById.mockResolvedValue({
        id: 10,
        expires_at: new Date('2000-01-01'),
      } as any);

      await expect(service.selectVouchers(100, [10], user)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('selection_status is already completed — throws', async () => {
      usageRepo.findById.mockResolvedValue(
        makeUsage({ selection_status: ReferralCodeUsageSelectionStatusEnum.COMPLETED }),
      );

      await expect(service.selectVouchers(100, [10], user)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('voucher not in code set — throws', async () => {
      const code = makeCode({ max_voucher_selections: 1, voucher_ids: [10] });
      usageRepo.findById.mockResolvedValue(makeUsage());
      rcRepo.findById.mockResolvedValue(code);

      await expect(service.selectVouchers(100, [99], user)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
