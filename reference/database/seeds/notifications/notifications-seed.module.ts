import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '@/notifications/persistence/entities/notification.entity';
import { NotificationsSeedService } from '@/database/seeds/notifications/notifications-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for notifications
 */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, UserEntity])],
  providers: [NotificationsSeedService],
  exports: [NotificationsSeedService],
})
export class NotificationsSeedModule {}
