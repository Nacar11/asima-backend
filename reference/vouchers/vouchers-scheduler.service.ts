import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { VoucherQrTokenEntity } from '@/vouchers/persistence/entities/voucher-qr-token.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';

@Injectable()
export class VouchersSchedulerService {
  private readonly logger = new Logger(VouchersSchedulerService.name);

  constructor(
    @InjectRepository(VoucherQrTokenEntity)
    private readonly voucherQrTokenRepository: Repository<VoucherQrTokenEntity>,
    @InjectRepository(UserVoucherEntity)
    private readonly userVoucherRepository: Repository<UserVoucherEntity>,
  ) {}

  /**
   * Clean up voucher_qr_tokens that are no longer needed.
   * - Expired + unused tokens: deleted immediately (worthless after 5-min window)
   * - Used tokens: deleted after 24 hours (short audit buffer; voucher_redemptions is the permanent trail)
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpQrTokens(): Promise<void> {
    this.logger.log('Starting voucher QR token cleanup...');
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Delete expired + unused tokens
    const expiredResult = await this.voucherQrTokenRepository.delete({
      expires_at: LessThan(now),
      used_at: IsNull(),
    });

    // 2. Delete used tokens older than 24 hours
    const usedResult = await this.voucherQrTokenRepository.delete({
      used_at: Not(IsNull()),
      created_at: LessThan(oneDayAgo),
    });

    const total = (expiredResult.affected ?? 0) + (usedResult.affected ?? 0);
    if (total > 0) {
      this.logger.log(
        `Cleaned up ${total} QR token(s): ${expiredResult.affected ?? 0} expired, ${usedResult.affected ?? 0} used.`,
      );
    }
  }

  /**
   * Mark stale user_vouchers as EXPIRED.
   * Targets rows where status is still AVAILABLE but expires_at has passed.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireStaleUserVouchers(): Promise<void> {
    this.logger.log('Starting stale user voucher expiry...');
    const now = new Date();
    const result = await this.userVoucherRepository
      .createQueryBuilder()
      .update(UserVoucherEntity)
      .set({ status: UserVoucherStatusEnum.EXPIRED, expired_at: now })
      .where('status = :status', { status: UserVoucherStatusEnum.AVAILABLE })
      .andWhere('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now })
      .execute();

    if ((result.affected ?? 0) > 0) {
      this.logger.log(`Expired ${result.affected} stale user voucher(s).`);
    }
  }
}
