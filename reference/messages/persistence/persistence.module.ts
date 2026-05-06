import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { BaseConversationRepository } from './base-conversation.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { BaseMessageRepository } from './base-message.repository';
import { MessageRepository } from './repositories/message.repository';
import { ConversationMapper } from './mappers/conversation.mapper';
import { MessageMapper } from './mappers/message.mapper';

/**
 * Messages Persistence Module.
 *
 * Provides data access layer for messages including repository
 * implementations and TypeORM entity registration.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([ConversationEntity, MessageEntity])],
  providers: [
    ConversationMapper,
    MessageMapper,
    {
      provide: BaseConversationRepository,
      useClass: ConversationRepository,
    },
    {
      provide: BaseMessageRepository,
      useClass: MessageRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseConversationRepository,
    BaseMessageRepository,
    ConversationMapper,
    MessageMapper,
  ],
})
export class MessagesPersistenceModule {}
