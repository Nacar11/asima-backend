import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';
import { VouchersService } from '@/vouchers/vouchers.service';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';

@Injectable()
export class ReferralCodesSchedulerService {
  private readonly logger = new Logger(ReferralCodesSchedulerService.name);

  constructor(
    private readonly referralCodeRepository: BaseReferralCodeRepository,
    private readonly referralCodeUsageRepository: BaseReferralCodeUsageRepository,
    private readonly referralCodeUsageSelectionRepository: BaseReferralCodeUsageSelectionRepository,
    private readonly vouchersService: VouchersService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoAssignExpiredSelections(): Promise<void> {
    const now = new Date();
    const overdueUsages =
      await this.referralCodeUsageRepository.findOverdueSelections(now);

    if (overdueUsages.length === 0) return;

    this.logger.log(
      `Auto-assigning ${overdueUsages.length} overdue voucher selection(s)...`,
    );

    for (const usage of overdueUsages) {
      try {
        const referralCode = await this.referralCodeRepository.findById(
          usage.referral_code_id,
        );
        const maxN = referralCode?.max_voucher_selections ?? 1;
        const candidateVoucherIds = referralCode?.voucher_ids ?? [];

        const nonExpired: number[] = [];
        for (const voucherId of candidateVoucherIds) {
          if (nonExpired.length >= maxN) break;
          try {
            const voucher = await this.vouchersService.findById(voucherId);
            if (!voucher.expires_at || voucher.expires_at > now) {
              nonExpired.push(voucherId);
            }
          } catch {
            // voucher deleted — skip
          }
        }

        for (const voucherId of nonExpired) {
          await this.vouchersService.giftVoucherToUser(voucherId, usage.user_id);
        }

        if (nonExpired.length > 0) {
          await this.referralCodeUsageSelectionRepository.createBulk(
            nonExpired.map((voucherId) => ({
              referral_code_usage_id: usage.id,
              voucher_id: voucherId,
            })),
          );
        }

        await this.referralCodeUsageRepository.updateSelectionStatus(
          usage.id,
          ReferralCodeUsageSelectionStatusEnum.AUTO_ASSIGNED,
        );

        this.logger.log(
          `Usage ${usage.id}: auto-assigned ${nonExpired.length} voucher(s).`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to auto-assign for usage ${usage.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
