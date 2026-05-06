import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserDeviceTokenEntity } from './entities/user-device-token.entity';
import { BaseNotificationRepository } from './base-notification.repository';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserDeviceTokenEntity]),
  ],
  providers: [
    {
      provide: BaseNotificationRepository,
      useClass: NotificationRepository,
    },
  ],
  exports: [TypeOrmModule, BaseNotificationRepository],
})
export class NotificationPersistenceModule {}
