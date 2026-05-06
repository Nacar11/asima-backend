import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';

export class ReferralCodeMapper {
  static toDomain(raw: ReferralCodeEntity): ReferralCode {
    const domain = new ReferralCode();
    domain.id = raw.id;
    domain.code = raw.code;
    domain.description = raw.description;
    domain.status = raw.status;
    domain.usage_limit = raw.usage_limit;
    domain.usage_count = raw.usage_count;
    domain.expires_at = raw.expires_at;
    domain.selection_mode = raw.selection_mode;
    domain.max_voucher_selections = raw.max_voucher_selections;
    domain.selection_timeout_hours = raw.selection_timeout_hours;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at ?? null;
    domain.created_by = raw.created_by?.id ?? null;
    domain.updated_by = raw.updated_by?.id ?? null;
    domain.deleted_by = raw.deleted_by?.id ?? null;
    domain.voucher_ids = raw.vouchers?.map((rcv) => rcv.voucher_id) ?? [];
    return domain;
  }

  static toPersistence(domain: Partial<ReferralCode>): Partial<ReferralCodeEntity> {
    const entity: Partial<ReferralCodeEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.description !== undefined) entity.description = domain.description;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.usage_limit !== undefined) entity.usage_limit = domain.usage_limit;
    if (domain.usage_count !== undefined) entity.usage_count = domain.usage_count;
    if (domain.expires_at !== undefined) entity.expires_at = domain.expires_at;
    if (domain.selection_mode !== undefined) entity.selection_mode = domain.selection_mode;
    if (domain.max_voucher_selections !== undefined) {
      entity.max_voucher_selections = domain.max_voucher_selections;
    }
    if (domain.selection_timeout_hours !== undefined) {
      entity.selection_timeout_hours = domain.selection_timeout_hours;
    }
    return entity;
  }
}
