import { Module } from '@nestjs/common';
import { MessagesService } from '@/messages/messages.service';
import { MessagesController } from '@/messages/messages.controller';
import { MessagesPersistenceModule } from '@/messages/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';

/**
 * Messages Module.
 *
 * Provides in-app messaging functionality for customer-seller communication.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    MessagesPersistenceModule,
    SellersModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService, MessagesPersistenceModule],
})
export class MessagesModule {}
