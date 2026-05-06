import { GiftedVoucherLog } from '@/gifted-voucher-logs/domain/gifted-voucher-log';
import { VoucherGiftLogEntity } from '@/vouchers/persistence/entities/voucher-gift-log.entity';

export class GiftedVoucherLogMapper {
  static toDomain(raw: VoucherGiftLogEntity): GiftedVoucherLog {
    const domain = new GiftedVoucherLog();
    domain.id = raw.id;
    domain.voucher_id = raw.voucher_id;
    domain.gifted_by_user_id = raw.gifted_by_user_id;
    domain.gifted_to_user_id = raw.gifted_to_user_id;
    domain.quantity = raw.quantity;
    domain.gifted_at = raw.created_at;

    // Snapshot fields
    domain.voucher_code = raw.voucher_code;
    domain.voucher_discount_type = raw.voucher_discount_type;
    domain.voucher_discount_value = Number(raw.voucher_discount_value);
    domain.voucher_max_discount_cap =
      raw.voucher_max_discount_cap != null
        ? Number(raw.voucher_max_discount_cap)
        : null;
    domain.voucher_scope = raw.voucher_scope;
    domain.voucher_description = raw.voucher_description;
    domain.seller_name = raw.seller_name;
    domain.gifted_to_first_name = raw.gifted_to_first_name;
    domain.gifted_to_last_name = raw.gifted_to_last_name;

    if (raw.gifted_by) {
      domain.gifted_by = {
        id: raw.gifted_by.id,
        first_name: (raw.gifted_by as any).first_name ?? null,
        last_name: (raw.gifted_by as any).last_name ?? null,
        email: (raw.gifted_by as any).email ?? null,
      };
    }

    if (raw.gifted_to) {
      domain.gifted_to = {
        id: raw.gifted_to.id,
        first_name: (raw.gifted_to as any).first_name ?? null,
        last_name: (raw.gifted_to as any).last_name ?? null,
        email: (raw.gifted_to as any).email ?? null,
      };
    }

    return domain;
  }
}
