import { DisputeMessageEntity } from '../entities/dispute-message.entity';
import { DisputeMessage } from '../../domain/dispute-message';
import { getCauser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for DisputeMessage domain and persistence models.
 *
 * @version 1
 * @since 1.0.0
 */
export class DisputeMessageMapper {
  static toDomain(raw: DisputeMessageEntity): DisputeMessage {
    const domain = new DisputeMessage();
    domain.id = raw.id;
    domain.dispute_id = raw.dispute_id;
    domain.sender_id = raw.sender_id;
    domain.sender_role = raw.sender_role;
    domain.message = raw.message;
    domain.attachment_urls = raw.attachment_urls;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;

    if (raw.sender) {
      domain.sender = getCauser(raw.sender) as any;
    }

    return domain;
  }

  static toPersistence(domain: DisputeMessage): DisputeMessageEntity {
    const entity = new DisputeMessageEntity();
    if (domain.id) entity.id = domain.id;
    entity.dispute_id = domain.dispute_id;
    entity.sender_id = domain.sender_id;
    entity.sender_role = domain.sender_role;
    entity.message = domain.message;
    entity.attachment_urls = domain.attachment_urls ?? null;
    return entity;
  }
}
