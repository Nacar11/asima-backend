import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserVoucher } from '@/vouchers/domain/user-voucher';

export class UserVoucherMapper {
  static toDomain(raw: UserVoucherEntity): UserVoucher {
    const domain: UserVoucher = {
      id: raw.id,
      user_id: raw.user_id,
      voucher_id: raw.voucher_id,
      collected_at: raw.collected_at,
      status: raw.status,
      used_at: raw.used_at,
      expired_at: raw.expired_at,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
    return domain;
  }
}
