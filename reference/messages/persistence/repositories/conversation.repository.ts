import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseConversationRepository } from '../base-conversation.repository';
import { ConversationEntity } from '../entities/conversation.entity';
import { Conversation } from '@/messages/domain/conversation';
import { ConversationMapper } from '../mappers/conversation.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/domain/user';
import { ConversationStatusEnum } from '@/messages/enums/conversation-status.enum';
import { MessageEntity } from '../entities/message.entity';

/**
 * Concrete implementation of conversation repository.
 *
 * Handles database operations for conversations using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ConversationRepository extends BaseConversationRepository {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly repository: Repository<ConversationEntity>,
  ) {
    super();
  }

  async create(
    conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Conversation> {
    const persistenceEntity = ConversationMapper.toPersistence(
      conversation as Conversation,
    );
    const savedEntity = await this.repository.save(persistenceEntity);

    return this.findById(savedEntity.id) as Promise<Conversation>;
  }

  async findById(id: number): Promise<NullableType<Conversation>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'seller',
        'customer',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    if (!entity) {
      return null;
    }

    // Load last message separately for better performance
    const lastMessageEntity = await this.repository.manager
      .getRepository(MessageEntity)
      .createQueryBuilder('message')
      .where('message.conversation_id = :id', { id })
      .orderBy('message.created_at', 'DESC')
      .limit(1)
      .getOne();

    if (lastMessageEntity) {
      entity.messages = [lastMessageEntity as MessageEntity];
    }

    return ConversationMapper.toDomain(entity);
  }

  async findByParticipants(
    sellerId: number,
    customerId: number,
    contextType?: string | null,
    contextId?: number | null,
  ): Promise<NullableType<Conversation>> {
    const whereClause: any = {
      seller_id: sellerId,
      customer_id: customerId,
    };

    if (contextType !== undefined) {
      whereClause.context_type = contextType;
    }
    if (contextId !== undefined) {
      whereClause.context_id = contextId;
    }

    const entity = await this.repository.findOne({
      where: whereClause,
      relations: ['seller', 'customer', 'created_by', 'updated_by'],
    });

    if (!entity) {
      return null;
    }

    // Load last message separately if needed
    const lastMessageEntity = await this.repository.manager
      .getRepository(MessageEntity)
      .createQueryBuilder('message')
      .where('message.conversation_id = :id', { id: entity.id })
      .orderBy('message.created_at', 'DESC')
      .limit(1)
      .getOne();

    if (lastMessageEntity) {
      entity.messages = [lastMessageEntity as MessageEntity];
    }

    return ConversationMapper.toDomain(entity);
  }

  async findAllForUser(
    userId: number,
    options: {
      filterQuery?: {
        status?: string;
      };
      paginationOptions: IPaginationOptions;
    },
  ): Promise<IPaginatedResult<Conversation>> {
    const { paginationOptions, filterQuery } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.seller', 'seller')
      .leftJoinAndSelect('conversation.customer', 'customer')
      .leftJoinAndSelect('conversation.created_by', 'created_by')
      .leftJoinAndSelect('conversation.updated_by', 'updated_by')
      .where(
        '(conversation.seller_id = :userId OR conversation.customer_id = :userId)',
        { userId },
      )
      .andWhere('conversation.deleted_at IS NULL');

    if (filterQuery?.status) {
      queryBuilder.andWhere('conversation.status = :status', {
        status: filterQuery.status,
      });
    }

    // Order by last_message_at if available, otherwise by created_at
    queryBuilder
      .orderBy('conversation.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    // Load last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      entities.map(async (entity) => {
        const lastMessageEntity = await this.repository.manager
          .getRepository(MessageEntity)
          .createQueryBuilder('message')
          .where('message.conversation_id = :id', { id: entity.id })
          .orderBy('message.created_at', 'DESC')
          .limit(1)
          .getOne();

        if (lastMessageEntity) {
          entity.messages = [lastMessageEntity as MessageEntity];
        }

        return ConversationMapper.toDomain(entity);
      }),
    );

    return {
      data: conversationsWithLastMessage,
      totalResults: total,
    };
  }

  async update(
    id: number,
    payload: Partial<Conversation>,
  ): Promise<Conversation> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    const updatedEntity = await this.repository.save(
      this.repository.create({
        ...ConversationMapper.toPersistence(existing as Conversation),
        ...ConversationMapper.toPersistence(payload as Conversation),
        id,
      }),
    );

    return this.findById(updatedEntity.id) as Promise<Conversation>;
  }

  async archive(id: number, causer: User): Promise<Conversation> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    return this.update(id, {
      status: ConversationStatusEnum.ARCHIVED,
      updated_by: causer,
    } as Partial<Conversation>);
  }
}
