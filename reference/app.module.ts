import path from 'path';

import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver } from 'nestjs-i18n';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';

import databaseConfig from '@/database/config/database.config';
import authConfig from '@/auth/config/auth.config';
import appConfig from '@/config/app.config';
import mailConfig from '@/mail/config/mail.config';
import facebookConfig from '@/auth/config/facebook.config';
import googleConfig from '@/auth/config/google.config';
import firebaseConfig from '@/config/firebase.config';
import uploadConfig from '@/config/upload.config';
import storageConfig from '@/storage/storage.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

const databaseModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options: DataSourceOptions) => {
    return new DataSource(options).initialize();
  },
});

import { I18nModule } from 'nestjs-i18n/dist/i18n.module';
import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { HomeModule } from '@/home/home.module';
import { DiscoveryModule } from '@/discovery/discovery.module';
import { SessionModule } from '@/session/session.module';
import { MailerModule } from '@/mailer/mailer.module';
import { DivisionsModule } from '@/masters/divisions/divisions.module';
import { DepartmentsModule } from '@/masters/departments/departments.module';
import { SectionsModule } from '@/masters/sections/sections.module';
import { SubSectionsModule } from '@/masters/sub-sections/sub-sections.module';
import { UserGroupsModule } from '@/user-groups/user-groups.module';
import { UserAssignmentsModule } from '@/user-assignments/user-assignments.module';
import { MenusModule } from '@/menus/menus.module';
import { UserPermissionsModule } from '@/user-permissions/user-permissions.module';
import { AttachmentsModule } from '@/attachments/attachments.module';
import { StorageModule } from '@/storage/storage.module';
import { WebhookModule } from '@/webhooks/webhook.module';

import { ClsModule } from 'nestjs-cls';
import { LoggersModule } from '@/loggers/loggers.module';

import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { MastersModule } from '@/masters/masters.module';
import { ParametersModule } from '@/parameters/parameters.module';
import { DocumentSignatoriesModule } from '@/document-signatories/document-signatories.module';
import { CompaniesModule } from '@/companies/companies.module';
import { DocumentControlsModule } from '@/document-controls/document-controls.module';
import { SellersModule } from '@/sellers/sellers.module';
import { SellerCertificationsModule } from '@/seller-certifications/seller-certifications.module';
import { SellerPortfolioModule } from '@/seller-portfolio/seller-portfolio.module';
import { CategoriesModule } from '@/categories/categories.module';
import { TagsModule } from '@/tags/tags.module';
import { ProductTagsModule } from '@/product-tags/product-tags.module';
import { UserDetailsModule } from '@/user-details/user-details.module';
import { ProductsModule } from '@/products/products.module';
import { AttributesModule } from '@/attributes/attributes.module';
import { ProductAttributesModule } from '@/product-attributes/product-attributes.module';
import { ProductAttributeValuesModule } from '@/product-attribute-values/product-attribute-values.module';
import { MediaModule } from '@/media/media.module';
import { ProductCategoriesModule } from '@/product-categories/product-categories.module';
import { ProductSpecificationsModule } from '@/product-specifications/product-specifications.module';
import { ShoppingCartsModule } from '@/shopping-carts/shopping-carts.module';
import { ProductVariantsModule } from '@/product-variants/product-variants.module';
import { InventoryStocksModule } from '@/inventory-stocks/inventory-stocks.module';
import { SalesOrdersModule } from '@/sales-orders/sales-orders.module';
import { SellerSalesOrdersModule } from '@/seller/sales-orders/seller-sales-orders.module';
import { SellerReturnRequestsModule } from '@/seller/return-requests/seller-return-requests.module';
import { SalesReportModule } from '@/seller/sales-report/sales-report.module';
import { SellerDetailedBookingsModule } from '@/seller/reports/detailed-bookings/seller-detailed-bookings.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { UserAddressesModule } from '@/user-addresses/user-addresses.module';
import { StoreAddressesModule } from '@/store-addresses/store-addresses.module';
import { CurrenciesModule } from '@/currencies/currencies.module';
// DEPRECATED: SellerMembersModule, SellerMemberServicesModule, ServicePackagesModule, MemberSchedulesModule
// These modules are removed as part of scheduling simplification (seller is the provider)
import { ServiceCategoriesModule } from '@/service-categories/service-categories.module';
import { ServicesModule } from '@/services/services.module';
import { ServiceAreasModule } from '@/service-areas/service-areas.module';
import { ServiceGalleryModule } from '@/service-gallery/service-gallery.module';
import { ServiceMilestoneTemplatesModule } from '@/service-milestone-templates/service-milestone-templates.module';
import { ServiceAddonsModule } from '@/service-addons/service-addons.module';
import { ServiceOptionGroupsModule } from '@/service-option-groups/service-option-groups.module';
import { ServiceOptionValuesModule } from '@/service-option-values/service-option-values.module';
import { ServiceOptionPricingRulesModule } from '@/service-option-pricing-rules/service-option-pricing-rules.module';
import { CartItemAddonsModule } from '@/cart-item-addons/cart-item-addons.module';
import { CartItemOptionsModule } from '@/cart-item-options/cart-item-options.module';
import { SalesOrderItemAddonsModule } from '@/sales-order-item-addons/sales-order-item-addons.module';
import { SalesOrderItemOptionsModule } from '@/sales-order-item-options/sales-order-item-options.module';
import { SellerSchedulesModule } from '@/seller-schedules/seller-schedules.module';
import { StoreUnavailabilityModule } from '@/store-unavailability/store-unavailability.module';
import { CheckoutOrdersModule } from '@/checkout-orders/checkout-orders.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { QuoteRequestsModule } from '@/quote-requests/quote-requests.module';
import { QuotationItemsModule } from '@/quotation-items/quotation-items.module';
import { BookingMilestonesModule } from '@/booking-milestones/booking-milestones.module';
import { EscrowTransactionsModule } from '@/escrow-transactions/escrow-transactions.module';
import { BookingCancellationsModule } from '@/booking-cancellations/booking-cancellations.module';
import { SellerEarningsModule } from '@/seller-earnings/seller-earnings.module';
import { SellerPayoutsModule } from '@/seller-payouts/seller-payouts.module';
import { SellerPayoutAccountsModule } from '@/seller-payout-accounts/seller-payout-accounts.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FeaturedProductsModule } from '@/featured-products/featured-products.module';
import { RecommendationsModule } from '@/recommendations/recommendations.module';
import { UserSearchHistoriesModule } from '@/user-search-histories/user-search-histories.module';
import { SubscriptionPlansModule } from '@/subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from '@/subscriptions/subscriptions.module';
import { SubscriptionPaymentsModule } from '@/subscription-payments/subscription-payments.module';
import { OrderTrackingModule } from '@/order-tracking/order-tracking.module';
import { ShippingModule } from '@/shipping/shipping.module';
import { CarouselBannersModule } from '@/carousel-banners/carousel-banners.module';
import { MessagesModule } from '@/messages/messages.module';
import { MonitoringModule } from '@/monitoring/monitoring.module';
import { ModerationModule } from '@/moderation/moderation.module';
import { AdminSubscriptionsModule } from '@/admin-subscriptions/admin-subscriptions.module';
import { FranchisesModule } from '@/franchises/franchises.module';
import { CancellationPoliciesModule } from '@/cancellation-policies/cancellation-policies.module';
import { InvoicesModule } from '@/invoices/invoices.module';
import { DragonPayDummyModule } from '@/dragonpay-dummy/dragonpay-dummy.module';
import { UnifiedCheckoutModule } from '@/unified-checkout/unified-checkout.module';
import { FirebaseModule } from '@/firebase/firebase.module';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { ReferralCodesModule } from '@/referral-codes/referral-codes.module';
import { VoucherRedemptionsModule } from '@/voucher-redemptions/voucher-redemptions.module';
import { GiftedVoucherLogsModule } from '@/gifted-voucher-logs/gifted-voucher-logs.module';
import { AccountDeletionRequestsModule } from '@/account-deletion-requests/account-deletion-requests.module';

import { BankAccountsModule } from '@/bank-accounts/bank-accounts.module';
import { BanksModule } from '@/banks/banks.module';
import { FormTemplatesModule } from '@/form-templates/form-templates.module';
import { FormSubmissionsModule } from '@/form-submissions/form-submissions.module';
import { QuotationCheckoutModule } from '@/quotation-checkout/quotation-checkout.module';
import { SalesOrderQuotationSnapshotsModule } from '@/sales-order-quotation-snapshots/sales-order-quotation-snapshots.module';
import { RatingTemplatesModule } from '@/rating-templates/rating-templates.module';
import { RatingsModule } from '@/ratings/ratings.module';
import { StoreUserGroupsModule } from '@/store-user-groups/store-user-groups.module';
import { StoreMembersModule } from '@/store-members/store-members.module';
import { DisputesModule } from '@/disputes/disputes.module';
import { CheckoutSessionsModule } from '@/checkout-sessions/checkout-sessions.module';
import { MembershipsModule } from '@/memberships/memberships.module';
import { MembershipVoucherConfigurationsModule } from '@/membership-voucher-configurations/membership-voucher-configurations.module';
import { MembershipPlansModule } from '@/membership-plans/membership-plans.module';
import { MembershipBillingPeriodsModule } from '@/membership-billing-periods/membership-billing-periods.module';
import { GuestVenueBookingModule } from '@/guest-venue-booking/guest-venue-booking.module';
import { PickleballMerchantsModule } from '@/pickleball-merchants/pickleball-merchants.module';
import { WalletsModule } from '@/wallets/wallets.module';
import { PlatformFeeSettingsModule } from '@/platform-fee-settings/platform-fee-settings.module';
import { AvailabilityRealtimeModule } from '@/availability-realtime/availability-realtime.module';

@Module({
  imports: [
    BankAccountsModule,
    BanksModule,
    TagsModule,
    ProductTagsModule,
    MediaModule,
    ProductCategoriesModule,
    ShoppingCartsModule,
    DocumentSignatoriesModule,
    DocumentControlsModule,
    ParametersModule,
    CompaniesModule,
    MastersModule,
    LoggersModule,
    WebhookModule,
    AttachmentsModule,
    UserPermissionsModule,
    UserGroupsModule,
    UserAssignmentsModule,
    MenusModule,
    UserPermissionsModule,
    StoreUserGroupsModule,
    StoreMembersModule,
    MembershipsModule,
    MembershipVoucherConfigurationsModule,
    MembershipPlansModule,
    MembershipBillingPeriodsModule,
    PickleballMerchantsModule,
    GuestVenueBookingModule,
    PlatformFeeSettingsModule,
    AvailabilityRealtimeModule,
    SubSectionsModule,
    SectionsModule,
    DepartmentsModule,
    DivisionsModule,
    SellersModule,
    SellerCertificationsModule,
    SellerPortfolioModule,
    CategoriesModule,
    UserDetailsModule,
    FeaturedProductsModule, // Must be before ProductsModule to avoid route conflict
    CarouselBannersModule,
    ProductsModule,
    AttributesModule,
    ProductAttributesModule,
    ProductAttributeValuesModule,
    ProductSpecificationsModule,
    ProductVariantsModule,
    InventoryStocksModule,
    SalesOrdersModule,
    SellerSalesOrdersModule,
    SellerReturnRequestsModule,
    SalesReportModule,
    SellerDetailedBookingsModule,
    OrderTrackingModule,
    UserAddressesModule,
    StoreAddressesModule,
    CurrenciesModule,
    // DEPRECATED: SellerMembersModule, SellerMemberServicesModule, ServicePackagesModule, MemberSchedulesModule
    ServiceCategoriesModule,
    ServicesModule,
    ServiceAreasModule,
    ServiceGalleryModule,
    ServiceMilestoneTemplatesModule,
    ServiceAddonsModule,
    ServiceOptionGroupsModule,
    ServiceOptionValuesModule,
    ServiceOptionPricingRulesModule,
    FormTemplatesModule,
    FormSubmissionsModule,
    QuotationCheckoutModule,
    SalesOrderQuotationSnapshotsModule,
    RatingTemplatesModule,
    RatingsModule,
    CartItemAddonsModule,
    CartItemOptionsModule,
    SalesOrderItemAddonsModule,
    SalesOrderItemOptionsModule,
    SellerSchedulesModule,
    StoreUnavailabilityModule,
    ReviewsModule,
    CheckoutOrdersModule,
    CheckoutPaymentsModule,
    BookingsModule,
    QuoteRequestsModule,
    QuotationItemsModule,
    BookingMilestonesModule,
    EscrowTransactionsModule,
    BookingCancellationsModule,
    DisputesModule,
    CheckoutSessionsModule,
    SellerEarningsModule,
    SellerPayoutsModule,
    SellerPayoutAccountsModule,
    NotificationsModule,
    RecommendationsModule,
    UserSearchHistoriesModule,
    SubscriptionPlansModule,
    SubscriptionsModule,
    SubscriptionPaymentsModule,
    MessagesModule,
    MonitoringModule,
    ModerationModule,
    AdminSubscriptionsModule,
    ReviewsModule,
    FranchisesModule,
    CancellationPoliciesModule,
    InvoicesModule,
    DragonPayDummyModule,
    UnifiedCheckoutModule,
    VouchersModule,
    ReferralCodesModule,
    VoucherRedemptionsModule,
    GiftedVoucherLogsModule,
    AccountDeletionRequestsModule,
    WalletsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 200,
      },
    ]),
    ShippingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        facebookConfig,
        googleConfig,
        firebaseConfig,
        uploadConfig,
        storageConfig,
      ],
      envFilePath: ['.env'],
    }),
    databaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      guard: { mount: true },
    }),
    UsersModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    DiscoveryModule,
    StorageModule.register(),
    ScheduleModule.forRoot(),
    FirebaseModule,
  ],
  providers: [],
})
export class AppModule {}
