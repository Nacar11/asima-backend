import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '@/discovery/discovery.module';
import { StorageModule } from '@/storage/storage.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { MailModule } from '@/mail/mail.module';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';
import { PickleballMerchantApplicationCourtEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application-court.entity';
import { PickleballLocationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-location.entity';
import { SellerPaymentProfileEntity } from '@/pickleball-merchants/persistence/entities/seller-payment-profile.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { StoreAddressEntity } from '@/store-addresses/persistence/entities/store-address.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { PickleballLocationsService } from '@/pickleball-merchants/pickleball-locations.service';
import { PickleballMerchantApplicationsService } from '@/pickleball-merchants/pickleball-merchant-applications.service';
import { PickleballLocationsController } from '@/pickleball-merchants/controllers/pickleball-locations.controller';
import { PublicPickleballMerchantApplicationsController } from '@/pickleball-merchants/controllers/public-pickleball-merchant-applications.controller';
import { AdminPickleballMerchantApplicationsController } from '@/pickleball-merchants/controllers/admin-pickleball-merchant-applications.controller';
import { SellerPickleballMerchantSubscriptionController } from '@/pickleball-merchants/controllers/seller-pickleball-merchant-subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PickleballMerchantApplicationEntity,
      PickleballMerchantApplicationCourtEntity,
      PickleballLocationEntity,
      SellerPaymentProfileEntity,
      UserEntity,
      SellerEntity,
      SubscriptionEntity,
      SubscriptionPlanEntity,
      ServiceEntity,
      SellerScheduleEntity,
      StoreAddressEntity,
      UserGroupEntity,
      UserAssignmentEntity,
      UserSellerAssignmentEntity,
      UserPermissionEntity,
      MenuEntity,
      EdistrictEntity,
      SubscriptionPaymentEntity,
    ]),
    DiscoveryModule,
    StorageModule.register(),
    NotificationsModule,
    MailModule,
  ],
  controllers: [
    PickleballLocationsController,
    PublicPickleballMerchantApplicationsController,
    AdminPickleballMerchantApplicationsController,
    SellerPickleballMerchantSubscriptionController,
  ],
  providers: [
    PickleballLocationsService,
    PickleballMerchantApplicationsService,
  ],
  exports: [PickleballLocationsService, PickleballMerchantApplicationsService],
})
export class PickleballMerchantsModule {}
