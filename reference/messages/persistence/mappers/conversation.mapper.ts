import { ConversationEntity } from '@/messages/persistence/entities/conversation.entity';
import { Conversation } from '@/messages/domain/conversation';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { MessageMapper } from '@/messages/persistence/mappers/message.mapper';

/**
 * Mapper for Conversation domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class ConversationMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns Conversation domain model
   */
  static toDomain(raw: ConversationEntity): Conversation {
    const domainEntity = new Conversation();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map seller relation if loaded
    if (raw.seller) {
      domainEntity.seller = raw.seller;
    }

    // Map customer relation if loaded
    if (raw.customer) {
      domainEntity.customer = getUser(raw.customer);
    }

    // Map last message if loaded
    if (raw.messages && raw.messages.length > 0) {
      const lastMessage = raw.messages[raw.messages.length - 1];
      domainEntity.last_message = MessageMapper.toDomain(lastMessage);
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns Conversation entity for persistence
   */
  static toPersistence(domainEntity: Conversation): ConversationEntity {
    const persistenceEntity = new ConversationEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Conversation,
        | 'id'
        | 'seller'
        | 'customer'
        | 'last_message'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.seller) {
      persistenceEntity.seller = domainEntity.seller as any;
    }

    if (domainEntity.customer) {
      persistenceEntity.customer = UserMapper.toPersistence(
        domainEntity.customer as any,
      );
    }

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as any,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as any,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as any,
      );
    }

    return persistenceEntity;
  }
}
