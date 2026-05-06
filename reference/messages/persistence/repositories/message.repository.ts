import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseMessageRepository } from '../base-message.repository';
import { MessageEntity } from '../entities/message.entity';
import { Message } from '@/messages/domain/message';
import { MessageMapper } from '../mappers/message.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';

/**
 * Concrete implementation of message repository.
 *
 * Handles database operations for messages using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class MessageRepository extends BaseMessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repository: Repository<MessageEntity>,
  ) {
    super();
  }

  async create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const persistenceEntity = MessageMapper.toPersistence(message as Message);
    const savedEntity = await this.repository.save(persistenceEntity);

    return this.findById(savedEntity.id) as Promise<Message>;
  }

  async findById(id: number): Promise<NullableType<Message>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['sender', 'conversation'],
    });

    return entity ? MessageMapper.toDomain(entity) : null;
  }

  async findByConversation(
    conversationId: number,
    paginationOptions: IPaginationOptions,
  ): Promise<IPaginatedResult<Message>> {
    const { page = 1, limit = 50 } = paginationOptions;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repository.findAndCount({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => MessageMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async markAsRead(messageIds: number[], userId: number): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }

    await this.repository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ read_at: new Date() })
      .where('id IN (:...messageIds)', { messageIds })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }

  async markAllAsRead(conversationId: number, userId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ read_at: new Date() })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }

  async findUnreadCount(
    conversationId: number,
    userId: number,
  ): Promise<number> {
    const count = await this.repository
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.sender_id != :userId', { userId })
      .andWhere('message.read_at IS NULL')
      .getCount();

    return count;
  }
}
