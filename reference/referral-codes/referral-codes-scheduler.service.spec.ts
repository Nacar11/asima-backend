import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ReferralCodesSchedulerService } from '@/referral-codes/referral-codes-scheduler.service';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';
import { VouchersService } from '@/vouchers/vouchers.service';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';

function makeCode(voucherIds: number[], maxSelections = 1): ReferralCode {
  const code = new ReferralCode();
  code.id = 1;
  code.code = 'TEST';
  code.status = ReferralCodeStatusEnum.ACTIVE;
  code.usage_count = 1;
  code.usage_limit = null;
  code.expires_at = null;
  code.selection_mode = ReferralCodeSelectionModeEnum.USER_SELECTION;
  code.max_voucher_selections = maxSelections;
  code.selection_timeout_hours = 48;
  code.voucher_ids = voucherIds;
  code.description = null;
  code.created_by = null;
  code.updated_by = null;
  code.deleted_by = null;
  code.created_at = new Date();
  code.updated_at = new Date();
  code.deleted_at = null;
  return code;
}

function makeUsage(id: number, userId: number): ReferralCodeUsage {
  const usage = new ReferralCodeUsage();
  usage.id = id;
  usage.referral_code_id = 1;
  usage.user_id = userId;
  usage.selection_status = ReferralCodeUsageSelectionStatusEnum.PENDING;
  usage.selection_deadline = new Date(Date.now() - 1000);
  usage.created_at = new Date();
  return usage;
}

describe('ReferralCodesSchedulerService', () => {
  let service: ReferralCodesSchedulerService;
  let rcRepo: jest.Mocked<Pick<BaseReferralCodeRepository, 'findById'>>;
  let usageRepo: jest.Mocked<Pick<BaseReferralCodeUsageRepository, 'findOverdueSelections' | 'updateSelectionStatus'>>;
  let selectionRepo: jest.Mocked<Pick<BaseReferralCodeUsageSelectionRepository, 'createBulk'>>;
  let vouchersService: jest.Mocked<Pick<VouchersService, 'giftVoucherToUser' | 'findById'>>;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    rcRepo = { findById: jest.fn() };
    usageRepo = {
      findOverdueSelections: jest.fn(),
      updateSelectionStatus: jest.fn(),
    };
    selectionRepo = { createBulk: jest.fn() };
    vouchersService = { giftVoucherToUser: jest.fn(), findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCodesSchedulerService,
        { provide: BaseReferralCodeRepository, useValue: rcRepo },
        { provide: BaseReferralCodeUsageRepository, useValue: usageRepo },
        { provide: BaseReferralCodeUsageSelectionRepository, useValue: selectionRepo },
        { provide: VouchersService, useValue: vouchersService },
      ],
    }).compile();

    service = module.get<ReferralCodesSchedulerService>(ReferralCodesSchedulerService);
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('assigns first N non-expired vouchers when max=1 and 2 candidates', async () => {
    const code = makeCode([10, 20], 1);
    const usage = makeUsage(100, 5);

    usageRepo.findOverdueSelections.mockResolvedValue([usage]);
    rcRepo.findById.mockResolvedValue(code);
    vouchersService.findById.mockResolvedValue({ id: 10, expires_at: null } as any);
    vouchersService.giftVoucherToUser.mockResolvedValue();
    selectionRepo.createBulk.mockResolvedValue();
    usageRepo.updateSelectionStatus.mockResolvedValue();

    await service.autoAssignExpiredSelections();

    expect(vouchersService.giftVoucherToUser).toHaveBeenCalledTimes(1);
    expect(vouchersService.giftVoucherToUser).toHaveBeenCalledWith(10, 5);
    expect(usageRepo.updateSelectionStatus).toHaveBeenCalledWith(
      100,
      ReferralCodeUsageSelectionStatusEnum.AUTO_ASSIGNED,
    );
  });

  it('skips expired vouchers and assigns 0 when all expired, still sets auto_assigned', async () => {
    const code = makeCode([10, 20], 2);
    const usage = makeUsage(101, 6);

    usageRepo.findOverdueSelections.mockResolvedValue([usage]);
    rcRepo.findById.mockResolvedValue(code);
    vouchersService.findById.mockResolvedValue({
      id: 10,
      expires_at: new Date('2000-01-01'),
    } as any);
    vouchersService.giftVoucherToUser.mockResolvedValue();
    usageRepo.updateSelectionStatus.mockResolvedValue();

    await service.autoAssignExpiredSelections();

    expect(vouchersService.giftVoucherToUser).not.toHaveBeenCalled();
    expect(usageRepo.updateSelectionStatus).toHaveBeenCalledWith(
      101,
      ReferralCodeUsageSelectionStatusEnum.AUTO_ASSIGNED,
    );
  });

  it('no-ops when there are no overdue usages', async () => {
    usageRepo.findOverdueSelections.mockResolvedValue([]);

    await service.autoAssignExpiredSelections();

    expect(vouchersService.giftVoucherToUser).not.toHaveBeenCalled();
    expect(usageRepo.updateSelectionStatus).not.toHaveBeenCalled();
  });
});
