import { QuotationItem } from '@/quotation-items/domain/quotation-item';
import { QuotationItemEntity } from '@/quotation-items/persistence/entities/quotation-item.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';

export class QuotationItemMapper {
  static toDomain(raw: QuotationItemEntity): QuotationItem {
    const domain = new QuotationItem();
    domain.id = raw.id;
    domain.quotation_id = raw.quotation_id;
    domain.item_type = raw.item_type;
    domain.service_id = raw.service_id;
    domain.product_id = raw.product_id;
    domain.name = raw.name;
    domain.description = raw.description;
    domain.quantity = raw.quantity;
    domain.unit_type = raw.unit_type;
    domain.unit_price = Number(raw.unit_price);
    domain.total_price = Number(raw.total_price);
    domain.suggested_schedule_date = raw.suggested_schedule_date;
    domain.sequence_order = raw.sequence_order;

    if (raw.service) {
      domain.service = ServiceMapper.toDomain(raw.service);
    }
    // Note: Product mapping skipped - ProductMapper.toDomain is async
    // Use product_id for reference instead
    if (raw.created_by) {
      domain.created_by = getCauser(raw.created_by);
    }
    if (raw.updated_by) {
      domain.updated_by = getCauser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domain.deleted_by = getCauser(raw.deleted_by);
    }

    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: QuotationItem): QuotationItemEntity {
    const entity = new QuotationItemEntity();
    if (domain.id) entity.id = domain.id;
    entity.quotation_id = domain.quotation_id;
    entity.item_type = domain.item_type;
    entity.service_id = domain.service_id ?? null;
    entity.product_id = domain.product_id ?? null;
    entity.name = domain.name;
    entity.description = domain.description ?? null;
    entity.quantity = domain.quantity;
    entity.unit_type = domain.unit_type ?? null;
    entity.unit_price = domain.unit_price;
    entity.total_price = domain.total_price;
    entity.suggested_schedule_date = domain.suggested_schedule_date ?? null;
    entity.sequence_order = domain.sequence_order ?? null;

    return entity;
  }
}
