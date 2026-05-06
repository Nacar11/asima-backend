import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';
import { QueryGiftedVoucherLogDto } from '@/gifted-voucher-logs/dto/query-gifted-voucher-log.dto';

export abstract class BaseGiftedVoucherLogRepository {
  abstract findAll(
    query: QueryGiftedVoucherLogDto,
    sellerId: number | null,
  ): Promise<{ data: GiftedVoucherLog[]; totalCount: number }>;

  abstract findById(
    id: number,
    sellerId?: number | null,
  ): Promise<GiftedVoucherLog | null>;
}
