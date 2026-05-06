import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';
import { QueryVoucherRedemptionDto } from '@/voucher-redemptions/dto/query-voucher-redemption.dto';

export abstract class BaseVoucherRedemptionRepository {
  abstract findAll(
    query: QueryVoucherRedemptionDto,
    sellerId: number | null,
  ): Promise<{ data: VoucherRedemption[]; totalCount: number }>;

  abstract findById(
    id: number,
    sellerId?: number | null,
  ): Promise<VoucherRedemption | null>;
}
