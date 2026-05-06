import { NestFactory } from '@nestjs/core';
// import { PositionsSeedService } from '@/database/seeds/positions/positions-seed.service';
// import { DepartmentSeedService } from '@/database/seeds/department/department-seed.service';
// import { SectionSeedService } from '@/database/seeds/section/section-seed.service';
// import { SubSectionSeedService } from '@/database/seeds/sub-section/sub-section-seed.service';
// import { DivisionSeedService } from '@/database/seeds/division/division-seed.service';
// import { CostCenterSeedService } from '@/database/seeds/cost-center/cost-center-seed.service';
import { MenuSeedService } from '@/database/seeds/menu/menu-seed.service';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { SeedRunnerService } from './seed-runner/seed-runner.service';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { SellerSeedService } from './seller/seller-seed.service';
import { CategorySeedService } from './category/category-seed.service';
import { TagSeedService } from './tag/tag-seed.service';
import { UserDetailSeedService } from './user-detail/user-detail-seed.service';
// Old product seed services (replaced by EkumpraProductSeedService)
// import { ProductSeedService } from './product/product-seed.service';
// import { ProductCategorySeedService } from './product-category/product-category-seed.service';
// import { ProductSpecificationSeedService } from './product-specification/product-specification-seed.service';
// import { ProductVariantSeedService } from './product-variant/product-variant-seed.service';
// import { AttributeSeedService } from './attribute/attribute-seed.service';
// import { ProductAttributeSeedService } from './product-attribute/product-attribute-seed.service';
// import { AttributeValueSeedService } from './attribute-value/attribute-value-seed.service';
// import { ProductAttributeValueSeedService } from './product-attribute-value/product-attribute-value-seed.service';
// import { InventoryStockSeedService } from './inventory-stock/inventory-stock-seed.service';
import { ReviewsSeedService } from './reviews/reviews-seed.service';
import { MediaSeedService } from './media/media-seed.service';
import { CarouselBannersSeedService } from './carousel-banners/carousel-banners-seed.service';
import { ShoppingCartSeedService } from './shopping-cart/shopping-cart-seed.service';
import { SalesOrderSeedService } from './sales-order/sales-order-seed.service';
import { SalesReportDemoOrdersSeedService } from './sales-report-demo-orders/sales-report-demo-orders-seed.service';
import { ReturnRequestSeedService } from './return-request/return-request-seed.service';
import { FeaturedProductsSeedService } from './featured-products/featured-products-seed.service';
import { ShippingSeedService } from './shipping/shipping-seed.service';
import { UserAddressSeedService } from './user-address/user-address-seed.service';
import { FranchiseSeedService } from './franchise/franchise-seed.service';
import { CurrenciesSeedService } from './currencies/currencies-seed.service';
import { ServiceCategoriesSeedService } from './service-categories/service-categories-seed.service';
import { UserAddressesSeedService } from './user-addresses/user-addresses-seed.service';
import { ProductTagsSeedService } from './product-tags/product-tags-seed.service';
import { NotificationsSeedService } from './notifications/notifications-seed.service';
// import { SellerSchedulesSeedService } from './seller-schedules/seller-schedules-seed.service';
// import { MemberSchedulesSeedService } from './member-schedules/member-schedules-seed.service';
// import { SellerMembersSeedService } from './seller-members/seller-members-seed.service';
// import { SellerMemberServicesSeedService } from './seller-member-services/seller-member-services-seed.service';
import { ServiceGallerySeedService } from './service-gallery/service-gallery-seed.service';
import { StoreUnavailabilitySeedService } from './store-unavailability/store-unavailability-seed.service';
import { ServicePackagesSeedService } from './service-packages/service-packages-seed.service';
import { ServiceMilestoneTemplatesSeedService } from './service-milestone-templates/service-milestone-templates-seed.service';
import { CancellationPoliciesSeedService } from './cancellation-policies/cancellation-policies-seed.service';
import { BookingsSeedService } from './bookings/bookings-seed.service';
import { SellerPendingBookingsSeedService } from './bookings/seller-pending-bookings-seed.service';
import { BookingMilestonesSeedService } from './booking-milestones/booking-milestones-seed.service';
import { BookingCancellationsSeedService } from './booking-cancellations/booking-cancellations-seed.service';
// import { CheckoutOrdersSeedService } from './checkout-orders/checkout-orders-seed.service';
import { CheckoutPaymentsSeedService } from './checkout-payments/checkout-payments-seed.service';
import { EscrowTransactionsSeedService } from './escrow-transactions/escrow-transactions-seed.service';
import { SellerEarningsSeedService } from './seller-earnings/seller-earnings-seed.service';
import { SellerPayoutsSeedService } from './seller-payouts/seller-payouts-seed.service';
import { SellerPayoutAccountsSeedService } from './seller-payout-accounts/seller-payout-accounts-seed.service';
import { SubscriptionPlansSeedService } from './subscription-plans/subscription-plans-seed.service';
// import { SubscriptionsSeedService } from './subscriptions/subscriptions-seed.service';
// import { SubscriptionPaymentsSeedService } from './subscription-payments/subscription-payments-seed.service';
// import { SubscriptionOperationsSeedService } from './subscription-operations/subscription-operations-seed.service';
import { ModerationSeedService } from './moderation/moderation-seed.service';
import { InvoiceSeedService } from './invoice/invoice-seed.service';
import { BankAccountSeedService } from './bank-account/bank-account-seed.service';
import { BankSeedService } from './bank/bank-seed.service';
import { UserGroupSeedService } from './user-group/user-group-seed.service';
import { BookingApproversUserGroupSeedService } from './booking-approvers-user-group/booking-approvers-user-group-seed.service';
import { UserPermissionSeedService } from './user-permission/user-permission-seed.service';
import { UserAssignmentSeedService } from './user-assignment/user-assignment-seed.service';
// import { CoffeeEquipmentServicesSeedService } from './coffee-equipment-services/coffee-equipment-services-seed.service';
// import { MepfServicesSeedService } from './mepf-services/mepf-services-seed.service'; // DEPRECATED
// import { TambayanDistrictSeedService } from './tambayan-district/tambayan-district-seed.service'; // DISABLED
import { AnjoWorldSeedService } from './anjo-world/anjo-world-seed.service';
import { ServiceLocationBrandsSeedService } from './service-location-brands/service-location-brands-seed.service';
import { EdistrictSeedService } from './edistrict/edistrict-seed.service';
import { LifestyleServicesSeedService } from './lifestyle-services/lifestyle-services-seed.service';
import { EkumpraProductSeedService } from './ekumpra-products/ekumpra-product-seed.service';
import { VoucherSeedService } from './voucher/voucher-seed.service';
import { ReferralCodeSeedService } from './referral-codes/referral-codes-seed.service';
import { MembershipPricingSeedService } from './membership-pricing/membership-pricing-seed.service';
import { MembershipsSeedService } from './memberships/memberships-seed.service';
import { PaymentGatewaySettingsSeedService } from './payment-gateway-settings/payment-gateway-settings-seed.service';
import { ProductionUserSeedService } from '@/database/seeds/production-user/production-user-seed.service';
import { ProductionUserAssignmentSeedService } from '@/database/seeds/production-user-assignment/production-user-assignment-seed.service';
import { ProductionSellerSeedService } from '@/database/seeds/production-seller/production-seller-seed.service';
import { TambayanServicesSeedService } from '@/database/seeds/tambayan-services/tambayan-services-seed.service';
import { MembershipPlanVoucherConfigurationSeedService } from '@/database/seeds/membership-plan-voucher-configuration/membership-plan-voucher-configuration-seed.service';
import { StressTestCartSeedService } from '@/database/seeds/stress-test-cart/stress-test-cart-seed.service';
// import { PurchaseOrderSeedService } from './purchase-order/purchase-order-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  const seedRunner = app.get(SeedRunnerService);

  // Not applicable BaseCode Seeders
  // await app.get(DivisionSeedService).run();
  // await app.get(SubSectionSeedService).run();
  // await app.get(SectionSeedService).run();
  // await app.get(DepartmentSeedService).run();
  // await app.get(CostCenterSeedService).run();

  const isProduction = process.env.NODE_ENV === 'production';
  /* Production Seeders */
  if (isProduction) {
    console.log('Production environment detected. Seeding production data.');
    await seedRunner.runSeed([
      app.get(ProductionUserSeedService),
      app.get(MenuSeedService),
      app.get(EkumpraProductSeedService),
      app.get(ShippingSeedService),
      app.get(CurrenciesSeedService),
      app.get(ServiceCategoriesSeedService),
      app.get(UserGroupSeedService),
      app.get(BookingApproversUserGroupSeedService),
      app.get(UserPermissionSeedService),
      app.get(ProductionUserAssignmentSeedService),
      app.get(ProductionSellerSeedService),
      app.get(AnjoWorldSeedService),
      app.get(MembershipPricingSeedService),
      app.get(PaymentGatewaySettingsSeedService),
      app.get(ServiceLocationBrandsSeedService),
      app.get(MembershipPlanVoucherConfigurationSeedService),
      app.get(EdistrictSeedService),
    ]);

    await app.close();
    return;
  }

  /* Local / Testing Seeders */
  // Core data (addresses before sellers so provider service_location_address_id can be set)
  await seedRunner.runSeed([
    app.get(UserSeedService),
    app.get(UserDetailSeedService),
    app.get(RoleSeedService),
    app.get(StatusSeedService),
    app.get(MenuSeedService),
    app.get(UserAddressSeedService),
    app.get(SellerSeedService),
  ]);

  // eKumpra seeders
  // Old product seeders - commented out in favor of EkumpraProductSeedService
  // await app.get(ProductSeedService).run();
  // await app.get(ProductCategorySeedService).run();
  // await app.get(ProductSpecificationSeedService).run();
  // await app.get(ProductVariantSeedService).run();
  // await app.get(AttributeSeedService).run();
  // await app.get(AttributeValueSeedService).run();
  // await app.get(ProductAttributeSeedService).run();
  // await app.get(ProductAttributeValueSeedService).run();
  // await app.get(InventoryStockSeedService).run();
  await seedRunner.runSeed([
    app.get(TagSeedService),
    app.get(CategorySeedService),
    app.get(MediaSeedService),
    app.get(CarouselBannersSeedService),
    app.get(ShoppingCartSeedService),
    app.get(ReviewsSeedService),
    app.get(FeaturedProductsSeedService),
    app.get(ShippingSeedService),
    app.get(SalesOrderSeedService),
    app.get(SalesReportDemoOrdersSeedService),
    app.get(FranchiseSeedService),
    app.get(VoucherSeedService),
    app.get(MembershipPricingSeedService),
    app.get(MembershipPlanVoucherConfigurationSeedService),
    app.get(MembershipsSeedService),
    app.get(PaymentGatewaySettingsSeedService),
    app.get(EkumpraProductSeedService),
  ]);

  // eTravajoe seeders
  // Subscription seeders (requires currencies and users)
  // await app.get(SubscriptionsSeedService).run();
  // await app.get(SubscriptionPaymentsSeedService).run();
  // await app.get(SubscriptionOperationsSeedService).run();
  // DEPRECATED: Generic seller schedules seeding removed - use coffee equipment seeder instead
  // await app.get(SellerSchedulesSeedService).run();

  // DEPRECATED: Member-based scheduling removed (seller is the provider)
  // await app.get(MemberSchedulesSeedService).run();
  // DEPRECATED: Generic seller members seeding removed
  // await app.get(SellerMembersSeedService).run();
  // await app.get(SellerMemberServicesSeedService).run();  // DEPRECATED: Generic checkout orders seeding removed - they should be created through normal flow
  // await app.get(CheckoutOrdersSeedService).run();
  // await app.get(PositionsSeedService).run();
  await seedRunner.runSeed([
    app.get(CurrenciesSeedService),
    app.get(SubscriptionPlansSeedService),
    app.get(ServiceCategoriesSeedService),
    app.get(UserAddressesSeedService),
    app.get(ProductTagsSeedService),
    app.get(NotificationsSeedService),
  ]);

  // Services infrastructure
  await seedRunner.runSeed([
    app.get(ServiceGallerySeedService),
    app.get(StoreUnavailabilitySeedService),
    app.get(ServicePackagesSeedService),
    app.get(ServiceMilestoneTemplatesSeedService),
    app.get(CancellationPoliciesSeedService),
  ]);

  // Booking flow
  await seedRunner.runSeed([
    app.get(BookingsSeedService),
    app.get(SellerPendingBookingsSeedService),
    app.get(BookingMilestonesSeedService),
    app.get(BookingCancellationsSeedService),
  ]);

  // Financial
  await seedRunner.runSeed([
    app.get(CheckoutPaymentsSeedService),
    app.get(EscrowTransactionsSeedService),
    app.get(SellerEarningsSeedService),
    app.get(SellerPayoutsSeedService),
    app.get(SellerPayoutAccountsSeedService),
    app.get(ReturnRequestSeedService),
    app.get(ModerationSeedService),
    app.get(InvoiceSeedService),
  ]);
  // Banking
  await seedRunner.runSeed([
    app.get(BankSeedService),
    app.get(BankAccountSeedService),
  ]);

  // User Groups & Permissions (must run after MenuSeedService and UserSeedService)
  await seedRunner.runSeed([
    app.get(UserGroupSeedService),
    app.get(BookingApproversUserGroupSeedService),
    app.get(UserPermissionSeedService),
    app.get(UserAssignmentSeedService),
  ]);

  // Public pickleball venue sample data
  await seedRunner.runSeed([
    app.get(AnjoWorldSeedService),
    // app.get(TambayanDistrictSeedService), // DISABLED: merged into ServiceLocationBrands seed
  ]);
  await app.get(ReviewsSeedService).seedSeller5ReviewsIfNeeded();

  // Location-specific service brands (Anjo + Tambayan)
  await seedRunner.runSeed(app.get(ServiceLocationBrandsSeedService));
  await seedRunner.runSeed(app.get(EdistrictSeedService));
  await seedRunner.runSeed(app.get(TambayanServicesSeedService));

  // Stress test data
  await seedRunner.runSeed([app.get(StressTestCartSeedService)]);

  // Referral codes (depends on vouchers) and its menu code
  await seedRunner.runSeed(app.get(ReferralCodeSeedService));

  await app.close();
};

void runSeed();
