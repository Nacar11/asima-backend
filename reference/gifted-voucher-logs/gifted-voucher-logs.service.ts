import { Injectable } from '@nestjs/common';
import { BaseGiftedVoucherLogRepository } from '@/gifted-voucher-logs/persistence/base-gifted-voucher-log.repository';
import { QueryGiftedVoucherLogDto } from '@/gifted-voucher-logs/dto/query-gifted-voucher-log.dto';
import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';
import { VouchersService } from '@/vouchers/vouchers.service';

@Injectable()
export class GiftedVoucherLogsService {
  constructor(
    private readonly repository: BaseGiftedVoucherLogRepository,
    private readonly vouchersService: VouchersService,
  ) {}

  async findAllForAdmin(
    query: QueryGiftedVoucherLogDto,
  ): Promise<{ data: GiftedVoucherLog[]; totalCount: number }> {
    return this.repository.findAll(query, null);
  }

  async findAllForSeller(
    query: QueryGiftedVoucherLogDto,
    sellerId: number,
  ): Promise<{ data: GiftedVoucherLog[]; totalCount: number }> {
    return this.repository.findAll(query, sellerId);
  }

  async findByIdForSeller(
    id: number,
    sellerId: number,
  ): Promise<GiftedVoucherLog | null> {
    const log = await this.repository.findById(id, sellerId);
    if (log) {
      await this.enrichWithEligibleItems(log);
    }
    return log;
  }

  async findById(id: number): Promise<GiftedVoucherLog | null> {
    const log = await this.repository.findById(id);
    if (log) {
      await this.enrichWithEligibleItems(log);
    }
    return log;
  }

  private async enrichWithEligibleItems(log: GiftedVoucherLog): Promise<void> {
    if (log.voucher_id == null) {
      log.voucher_deleted = true;
      return;
    }
    try {
      const voucher = await this.vouchersService.findById(log.voucher_id);
      log.voucher_categories = voucher.voucher_categories ?? [];
      log.voucher_products = voucher.voucher_products ?? [];
      log.voucher_services = voucher.voucher_services ?? [];
      log.voucher_service_categories = voucher.voucher_service_categories ?? [];
      log.voucher_deleted = false;
    } catch {
      log.voucher_deleted = true;
    }
  }
}
