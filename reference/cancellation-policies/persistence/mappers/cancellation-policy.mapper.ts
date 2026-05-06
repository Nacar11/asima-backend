import { CancellationPolicy } from '@/cancellation-policies/domain/cancellation-policy';
import { CancellationPolicyEntity } from '@/cancellation-policies/persistence/entities/cancellation-policy.entity';

export class CancellationPolicyMapper {
  static toDomain(raw: CancellationPolicyEntity): CancellationPolicy {
    const domain = new CancellationPolicy();

    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.service_id = raw.service_id;
    domain.name = raw.name;
    domain.description = raw.description;
    domain.free_cancel_hours = raw.free_cancel_hours;
    domain.partial_cancel_hours = raw.partial_cancel_hours;
    domain.partial_cancel_percent = Number(raw.partial_cancel_percent);
    domain.no_show_charge_percent = Number(raw.no_show_charge_percent);
    domain.status = raw.status;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;

    if (raw.seller) {
      domain.seller = {
        id: raw.seller.id,
        store_name: raw.seller.store_name,
      };
    }

    if (raw.service) {
      domain.service = {
        id: raw.service.id,
        title: raw.service.title,
      };
    }

    return domain;
  }

  static toPersistence(
    domain: Partial<CancellationPolicy>,
  ): Partial<CancellationPolicyEntity> {
    const entity: Partial<CancellationPolicyEntity> = {};

    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.seller_id !== undefined) entity.seller_id = domain.seller_id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.free_cancel_hours !== undefined)
      entity.free_cancel_hours = domain.free_cancel_hours;
    if (domain.partial_cancel_hours !== undefined)
      entity.partial_cancel_hours = domain.partial_cancel_hours;
    if (domain.partial_cancel_percent !== undefined)
      entity.partial_cancel_percent = domain.partial_cancel_percent;
    if (domain.no_show_charge_percent !== undefined)
      entity.no_show_charge_percent = domain.no_show_charge_percent;
    if (domain.status !== undefined) entity.status = domain.status;

    return entity;
  }
}
