import { NotificationEntity } from '@/notifications/persistence/entities/notification.entity';
import { Notification } from '@/notifications/domain/notification';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';

/**
 * Mapper for Notification domain and persistence models.
 *
 * Uses explicit field mapping to avoid copying TypeORM internal properties.
 *
 * @version 1
 * @since 1.0.0
 */
export class NotificationMapper {
  static toDomain(raw: NotificationEntity): Notification {
    const domainEntity = new Notification();

    // Explicit field mapping - avoids copying TypeORM internals
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.type = raw.type as NotificationTypeEnum;
    domainEntity.title = raw.title;
    domainEntity.body = raw.body;
    domainEntity.entity_type = raw.entity_type;
    domainEntity.entity_id = raw.entity_id;
    domainEntity.action_url = raw.action_url;
    domainEntity.read_at = raw.read_at;
    domainEntity.push_sent = raw.push_sent;
    domainEntity.push_sent_at = raw.push_sent_at;
    domainEntity.status = raw.status;
    domainEntity.created_at = raw.created_at;

    if (raw.user) {
      domainEntity.user = raw.user;
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: Notification): NotificationEntity {
    const persistenceEntity = new NotificationEntity();

    persistenceEntity.id = domainEntity.id;
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.title = domainEntity.title;
    persistenceEntity.body = domainEntity.body ?? null;
    persistenceEntity.entity_type = domainEntity.entity_type ?? null;
    persistenceEntity.entity_id = domainEntity.entity_id ?? null;
    persistenceEntity.action_url = domainEntity.action_url ?? null;
    persistenceEntity.read_at = domainEntity.read_at ?? null;
    persistenceEntity.push_sent = domainEntity.push_sent;
    persistenceEntity.push_sent_at = domainEntity.push_sent_at ?? null;
    persistenceEntity.status = domainEntity.status ?? 'Active';
    persistenceEntity.created_at = domainEntity.created_at;

    return persistenceEntity;
  }
}
