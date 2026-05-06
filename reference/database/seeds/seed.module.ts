import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import { SeedRunnerModule } from './seed-runner/seed-runner.module';
import { SeedMigrationEntity } from './seed-migration/seed-migration.entity';
import { RoleSeedModule } from './role/role-seed.module';
import { StatusSeedModule } from './status/status-seed.module';
import { UserSeedModule } from './user/user-seed.module';
import { MenuSeedModule } from '@/database/seeds/menu/menu-seed.module';

import databaseConfig from '@/database/config/database.config';
import appConfig from '@/config/app.config';

import { DivisionSeedModule } from '@/database/seeds/division/division-seed.module';
import { SubSectionSeedModule } from '@/database/seeds/sub-section/sub-section-seed.module';
import { SectionSeedModule } from '@/database/seeds/section/section-seed.module';
import { DepartmentSeedModule } from '@/database/seeds/department/department-seed.module';
import { CostCenterSeedModule } from '@/database/seeds/cost-center/cost-center-seed.module';
import { SellerSeedModule } from '@/database/seeds/seller/seller-seed.module';
import { CategorySeedModule } from '@/database/seeds/category/category-seed.module';
// import { CategoryImageSeedModule } from '@/database/seeds/category-image/category-image-seed.module';
import { TagSeedModule } from '@/database/seeds/tag/tag-seed.module';
import { UserDetailSeedModule } from '@/database/seeds/user-detail/user-detail-seed.module';
// Old product seed modules (replaced by EkumpraProductSeedModule)
// import { ProductSeedModule } from '@/database/seeds/product/product-seed.module';
// import { ProductCategorySeedModule } from '@/database/seeds/product-category/product-category-seed.module';
// import { ProductSpecificationSeedModule } from '@/database/seeds/product-specification/product-specification-seed.module';
// import { ProductVariantSeedModule } from '@/database/seeds/product-variant/product-variant-seed.module';
// import { AttributeSeedModule } from '@/database/seeds/attribute/attribute-seed.module';
// import { ProductAttributeSeedModule } from '@/database/seeds/product-attribute/product-attribute-seed.module';
// import { AttributeValueSeedModule } from '@/database/seeds/attribute-value/attribute-value-seed.module';
// import { ProductAttributeValueSeedModule } from '@/database/seeds/product-attribute-value/product-attribute-value-seed.module';
// import { InventoryStockSeedModule } from './inventory-stock/inventory-stock-seed.module';
import { MediaSeedModule } from './media/media-seed.module';
import { CarouselBannersSeedModule } from './carousel-banners/carousel-banners-seed.module';
import { ShoppingCartSeedModule } from './shopping-cart/shopping-cart-seed.module';
import { SalesOrderSeedModule } from './sales-order/sales-order-seed.module';
import { SalesReportDemoOrdersSeedModule } from './sales-report-demo-orders/sales-report-demo-orders-seed.module';
import { FeaturedProductsSeedModule } from './featured-products/featured-products-seed.module';
import { ShippingSeedModule } from './shipping/shipping-seed.module';
import { ReviewsSeedModule } from '@/database/seeds/reviews/reviews-seed.module';
import { UserAddressSeedModule } from './user-address/user-address-seed.module';
import { FranchiseSeedModule } from './franchise/franchise-seed.module';
import { CurrenciesSeedModule } from './currencies/currencies-seed.module';
import { ServiceCategoriesSeedModule } from './service-categories/service-categories-seed.module';
import { UserAddressesSeedModule } from './user-addresses/user-addresses-seed.module';
import { ProductTagsSeedModule } from './product-tags/product-tags-seed.module';
import { NotificationsSeedModule } from './notifications/notifications-seed.module';
import { SellerSchedulesSeedModule } from './seller-schedules/seller-schedules-seed.module';
import { MemberSchedulesSeedModule } from './member-schedules/member-schedules-seed.module';
import { SellerMembersSeedModule } from './seller-members/seller-members-seed.module';
import { SellerMemberServicesSeedModule } from './seller-member-services/seller-member-services-seed.module';
import { ServiceGallerySeedModule } from './service-gallery/service-gallery-seed.module';
import { StoreUnavailabilitySeedModule } from './store-unavailability/store-unavailability-seed.module';
import { ServicePackagesSeedModule } from './service-packages/service-packages-seed.module';
import { ServiceMilestoneTemplatesSeedModule } from './service-milestone-templates/service-milestone-templates-seed.module';
import { CancellationPoliciesSeedModule } from './cancellation-policies/cancellation-policies-seed.module';
import { BookingsSeedModule } from './bookings/bookings-seed.module';
import { SellerPendingBookingsSeedModule } from './bookings/seller-pending-bookings-seed.module';
import { BookingMilestonesSeedModule } from './booking-milestones/booking-milestones-seed.module';
import { BookingCancellationsSeedModule } from './booking-cancellations/booking-cancellations-seed.module';
import { CheckoutOrdersSeedModule } from './checkout-orders/checkout-orders-seed.module';
import { CheckoutPaymentsSeedModule } from './checkout-payments/checkout-payments-seed.module';
import { EscrowTransactionsSeedModule } from './escrow-transactions/escrow-transactions-seed.module';
import { SellerEarningsSeedModule } from './seller-earnings/seller-earnings-seed.module';
import { SellerPayoutsSeedModule } from './seller-payouts/seller-payouts-seed.module';
import { SellerPayoutAccountsSeedModule } from './seller-payout-accounts/seller-payout-accounts-seed.module';
import { ReturnRequestSeedModule } from './return-request/return-request-seed.module';
import { InvoiceSeedModule } from './invoice/invoice-seed.module';
import { SubscriptionPlansSeedModule } from './subscription-plans/subscription-plans-seed.module';
import { SubscriptionsSeedModule } from './subscriptions/subscriptions-seed.module';
import { SubscriptionPaymentsSeedModule } from './subscription-payments/subscription-payments-seed.module';
import { SubscriptionOperationsSeedModule } from './subscription-operations/subscription-operations-seed.module';
import { ModerationSeedModule } from './moderation/moderation-seed.module';
import { BankAccountSeedModule } from './bank-account/bank-account-seed.module';
import { BankSeedModule } from './bank/bank-seed.module';
import { UserGroupSeedModule } from './user-group/user-group-seed.module';
import { BookingApproversUserGroupSeedModule } from './booking-approvers-user-group/booking-approvers-user-group-seed.module';
import { UserPermissionSeedModule } from './user-permission/user-permission-seed.module';
import { UserAssignmentSeedModule } from './user-assignment/user-assignment-seed.module';
// import { CoffeeEquipmentServicesSeedModule } from './coffee-equipment-services/coffee-equipment-services-seed.module';
// import { MepfServicesSeedModule } from './mepf-services/mepf-services-seed.module'; // DEPRECATED
// import { TambayanDistrictSeedModule } from './tambayan-district/tambayan-district-seed.module'; // DISABLED
import { AnjoWorldSeedModule } from './anjo-world/anjo-world-seed.module';
import { ServiceLocationBrandsSeedModule } from './service-location-brands/service-location-brands-seed.module';
import { EdistrictSeedModule } from './edistrict/edistrict-seed.module';
import { EkumpraProductSeedModule } from './ekumpra-products/ekumpra-product-seed.module';
import { VoucherSeedModule } from './voucher/voucher-seed.module';
import { ReferralCodeSeedModule } from './referral-codes/referral-codes-seed.module';
import { LifestyleServicesSeedModule } from './lifestyle-services/lifestyle-services-seed.module';
import { ProductionUserSeedModule } from './production-user/production-user-seed.module';
import { ProductionUserAssignmentSeedModule } from './production-user-assignment/production-user-assignment-seed.module';
import { ProductionSellerSeedModule } from './production-seller/production-seller-seed.module';
import { MembershipPricingSeedModule } from './membership-pricing/membership-pricing-seed.module';
import { MembershipsSeedModule } from './memberships/memberships-seed.module';
import { PaymentGatewaySettingsSeedModule } from './payment-gateway-settings/payment-gateway-settings-seed.module';
import { TambayanServicesSeedModule } from './tambayan-services/tambayan-services-seed.module';
import { MembershipPlanVoucherConfigurationSeedModule } from './membership-plan-voucher-configuration/membership-plan-voucher-configuration-seed.module';
import { StressTestCartSeedModule } from './stress-test-cart/stress-test-cart-seed.module';
@Module({
  imports: [
    SeedRunnerModule,
    TypeOrmModule.forFeature([SeedMigrationEntity]),
    DepartmentSeedModule,
    SectionSeedModule,
    SubSectionSeedModule,
    DivisionSeedModule,
    CostCenterSeedModule,
    RoleSeedModule,
    StatusSeedModule,
    UserSeedModule,
    MenuSeedModule,
    SellerSeedModule,
    CategorySeedModule,
    TagSeedModule,
    UserDetailSeedModule,
    // Old product seed modules - commented out in favor of EkumpraProductSeedModule
    // ProductSeedModule,
    // ProductCategorySeedModule,
    // ProductSpecificationSeedModule,
    // ProductVariantSeedModule,
    // AttributeSeedModule,
    // ProductAttributeSeedModule,
    // AttributeValueSeedModule,
    // ProductAttributeValueSeedModule,
    // InventoryStockSeedModule,
    ReviewsSeedModule,
    MediaSeedModule,
    CarouselBannersSeedModule,
    UserAddressSeedModule,
    ShoppingCartSeedModule,
    SalesOrderSeedModule,
    SalesReportDemoOrdersSeedModule,
    ReturnRequestSeedModule,
    FeaturedProductsSeedModule,
    ShippingSeedModule,
    FranchiseSeedModule,
    CurrenciesSeedModule,
    SubscriptionPlansSeedModule,
    SubscriptionsSeedModule,
    ServiceCategoriesSeedModule,
    UserAddressesSeedModule,
    ProductTagsSeedModule,
    NotificationsSeedModule,
    SellerSchedulesSeedModule,
    MemberSchedulesSeedModule,
    SellerMembersSeedModule,
    SellerMemberServicesSeedModule,
    ServiceGallerySeedModule,
    StoreUnavailabilitySeedModule,
    ServicePackagesSeedModule,
    ServiceMilestoneTemplatesSeedModule,
    CancellationPoliciesSeedModule,
    BookingsSeedModule,
    SellerPendingBookingsSeedModule,
    BookingMilestonesSeedModule,
    BookingCancellationsSeedModule,
    CheckoutOrdersSeedModule,
    CheckoutPaymentsSeedModule,
    EscrowTransactionsSeedModule,
    SellerEarningsSeedModule,
    SellerPayoutsSeedModule,
    SellerPayoutAccountsSeedModule,
    InvoiceSeedModule,
    SubscriptionPlansSeedModule,
    SubscriptionsSeedModule,
    SubscriptionPaymentsSeedModule,
    SubscriptionOperationsSeedModule,
    ModerationSeedModule,
    BankAccountSeedModule,
    BankSeedModule,
    UserGroupSeedModule,
    BookingApproversUserGroupSeedModule,
    UserPermissionSeedModule,
    UserAssignmentSeedModule,
    // CoffeeEquipmentServicesSeedModule, // Replaced with MEPF services
    // MepfServicesSeedModule, // DEPRECATED - replaced with Tambayan District
    // TambayanDistrictSeedModule, // DISABLED: merged into ServiceLocationBrands seed
    AnjoWorldSeedModule,
    ServiceLocationBrandsSeedModule,
    EdistrictSeedModule,
    LifestyleServicesSeedModule,
    EkumpraProductSeedModule,
    VoucherSeedModule,
    ReferralCodeSeedModule,
    ProductionUserSeedModule,
    ProductionUserAssignmentSeedModule,
    ProductionSellerSeedModule,
    MembershipPricingSeedModule,
    MembershipsSeedModule,
    PaymentGatewaySettingsSeedModule,
    TambayanServicesSeedModule,
    MembershipPlanVoucherConfigurationSeedModule,
    StressTestCartSeedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
  ],
})
export class SeedModule {}
