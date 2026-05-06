import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationPersistenceModule } from './persistence/persistence.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { PushNotificationService } from './services/push-notification.service';
import { FcmTokenService } from './services/fcm-token.service';
import { MailModule } from '@/mail/mail.module';
import { BookingNotificationService } from './services/booking-notification.service';
import { BookingEmailMirrorNotificationService } from './services/booking-email-mirror-notification.service';
import { OrderNotificationService } from './services/order-notification.service';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { StorageModule } from '@/storage/storage.module';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';

/**
 * Notifications Module.
 *
 * Provides notification functionality for in-app, push, and real-time
 * WebSocket notifications. Handles notification creation, retrieval,
 * read status, push notification sending via FCM, real-time delivery
 * via Socket.io, and scheduled time-based notifications.
 *
 * @version 3
 * @since 1.0.0
 */
@Module({
  imports: [
    NotificationPersistenceModule,
    MailModule,
    StorageModule.register(),
    TypeOrmModule.forFeature([
      BookingEntity,
      BookingMilestoneEntity,
      QuoteRequestEntity,
      UserEntity,
      SellerEntity,
      SalesOrderEntity,
      UserGroupEntity,
      UserAssignmentEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('auth.expires', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsSchedulerService,
    PushNotificationService,
    FcmTokenService,
    BookingNotificationService,
    BookingEmailMirrorNotificationService,
    OrderNotificationService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationsSchedulerService,
    PushNotificationService,
    FcmTokenService,
    BookingNotificationService,
    BookingEmailMirrorNotificationService,
    OrderNotificationService,
  ],
})
export class NotificationsModule {}
