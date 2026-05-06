import { OrderTrackingEventEntity } from '@/order-tracking/persistence/entities/order-tracking-event.entity';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';

/**
 * Mapper for OrderTrackingEvent domain and persistence models
 */
export class OrderTrackingEventMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(raw: OrderTrackingEventEntity): OrderTrackingEvent {
    const domainEntity = new OrderTrackingEvent();

    domainEntity.id = raw.id;
    domainEntity.order_id = raw.order_id;
    domainEntity.event_type = raw.event_type as OrderEventTypeEnum;
    domainEntity.description = raw.description || undefined;
    domainEntity.notes = raw.notes || undefined;
    domainEntity.location = raw.location || undefined;
    domainEntity.latitude = raw.latitude ? Number(raw.latitude) : undefined;
    domainEntity.longitude = raw.longitude ? Number(raw.longitude) : undefined;
    domainEntity.event_timestamp = raw.event_timestamp;
    domainEntity.created_at = raw.created_at;

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity
   */
  static toPersistence(
    domainEntity: Partial<OrderTrackingEvent>,
  ): OrderTrackingEventEntity {
    const persistenceEntity = new OrderTrackingEventEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.order_id = domainEntity.order_id!;
    persistenceEntity.event_type = domainEntity.event_type!;
    persistenceEntity.description = domainEntity.description || null;
    persistenceEntity.notes = domainEntity.notes || null;
    persistenceEntity.location = domainEntity.location || null;
    persistenceEntity.latitude = domainEntity.latitude || null;
    persistenceEntity.longitude = domainEntity.longitude || null;
    persistenceEntity.event_timestamp =
      domainEntity.event_timestamp || new Date();

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    return persistenceEntity;
  }
}
