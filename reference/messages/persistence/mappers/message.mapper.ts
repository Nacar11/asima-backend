import { MessageEntity } from '@/messages/persistence/entities/message.entity';
import { Message } from '@/messages/domain/message';
import { getUser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Mapper for Message domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class MessageMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns Message domain model
   */
  static toDomain(raw: MessageEntity): Message {
    const domainEntity = new Message();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map sender relation if loaded
    if (raw.sender) {
      domainEntity.sender = getUser(raw.sender);
    }

    // Map conversation relation if loaded (usually not needed in domain)
    // if (raw.conversation) {
    //   domainEntity.conversation = raw.conversation;
    // }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns Message entity for persistence
   */
  static toPersistence(domainEntity: Message): MessageEntity {
    const persistenceEntity = new MessageEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<Message, 'id' | 'sender' | 'conversation_id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.conversation_id) {
      persistenceEntity.conversation_id = domainEntity.conversation_id;
    }

    if (domainEntity.sender) {
      persistenceEntity.sender = UserMapper.toPersistence(
        domainEntity.sender as any,
      );
    }

    return persistenceEntity;
  }
}
