import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SeedModule } from './seed.module';
import { SeedRunnerService } from './seed-runner/seed-runner.service';
import { ISeedService } from './seed.interface';
import { RoleSeedService } from './role/role-seed.service';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { UserDetailSeedService } from './user-detail/user-detail-seed.service';
import { MenuSeedService } from './menu/menu-seed.service';
import { SellerSeedService } from './seller/seller-seed.service';
import { TagSeedService } from './tag/tag-seed.service';
import { CategorySeedService } from './category/category-seed.service';
import { MediaSeedService } from './media/media-seed.service';
import { CarouselBannersSeedService } from './carousel-banners/carousel-banners-seed.service';
import { UserAddressSeedService } from './user-address/user-address-seed.service';
import { ShoppingCartSeedService } from './shopping-cart/shopping-cart-seed.service';
import { ReviewsSeedService } from './reviews/reviews-seed.service';
import { FeaturedProductsSeedService } from './featured-products/featured-products-seed.service';
import { ShippingSeedService } from './shipping/shipping-seed.service';
import { SalesOrderSeedService } from './sales-order/sales-order-seed.service';
import { SalesReportDemoOrdersSeedService } from './sales-report-demo-orders/sales-report-demo-orders-seed.service';
import { FranchiseSeedService } from './franchise/franchise-seed.service';
import { EkumpraProductSeedService } from './ekumpra-products/ekumpra-product-seed.service';
import { CurrenciesSeedService } from './currencies/currencies-seed.service';
import { SubscriptionPlansSeedService } from './subscription-plans/subscription-plans-seed.service';
import { ServiceCategoriesSeedService } from './service-categories/service-categories-seed.service';
import { UserAddressesSeedService } from './user-addresses/user-addresses-seed.service';
import { ProductTagsSeedService } from './product-tags/product-tags-seed.service';
import { NotificationsSeedService } from './notifications/notifications-seed.service';
import { ServiceGallerySeedService } from './service-gallery/service-gallery-seed.service';
import { StoreUnavailabilitySeedService } from './store-unavailability/store-unavailability-seed.service';
import { ServicePackagesSeedService } from './service-packages/service-packages-seed.service';
import { ServiceMilestoneTemplatesSeedService } from './service-milestone-templates/service-milestone-templates-seed.service';
import { CancellationPoliciesSeedService } from './cancellation-policies/cancellation-policies-seed.service';
import { BookingsSeedService } from './bookings/bookings-seed.service';
import { SellerPendingBookingsSeedService } from './bookings/seller-pending-bookings-seed.service';
import { BookingMilestonesSeedService } from './booking-milestones/booking-milestones-seed.service';
import { BookingCancellationsSeedService } from './booking-cancellations/booking-cancellations-seed.service';
import { CheckoutPaymentsSeedService } from './checkout-payments/checkout-payments-seed.service';
import { EscrowTransactionsSeedService } from './escrow-transactions/escrow-transactions-seed.service';
import { SellerEarningsSeedService } from './seller-earnings/seller-earnings-seed.service';
import { SellerPayoutsSeedService } from './seller-payouts/seller-payouts-seed.service';
import { SellerPayoutAccountsSeedService } from './seller-payout-accounts/seller-payout-accounts-seed.service';
import { ReturnRequestSeedService } from './return-request/return-request-seed.service';
import { ModerationSeedService } from './moderation/moderation-seed.service';
import { InvoiceSeedService } from './invoice/invoice-seed.service';
import { BankSeedService } from './bank/bank-seed.service';
import { BankAccountSeedService } from './bank-account/bank-account-seed.service';
import { UserGroupSeedService } from './user-group/user-group-seed.service';
import { BookingApproversUserGroupSeedService } from './booking-approvers-user-group/booking-approvers-user-group-seed.service';
import { UserPermissionSeedService } from './user-permission/user-permission-seed.service';
import { UserAssignmentSeedService } from './user-assignment/user-assignment-seed.service';
// import { MepfServicesSeedService } from './mepf-services/mepf-services-seed.service'; // DEPRECATED
import { AnjoWorldSeedService } from './anjo-world/anjo-world-seed.service';
import { ServiceLocationBrandsSeedService } from './service-location-brands/service-location-brands-seed.service';

const seedServiceMap: Record<string, any> = {
  UserSeedService,
  UserDetailSeedService,
  RoleSeedService,
  StatusSeedService,
  MenuSeedService,
  SellerSeedService,
  TagSeedService,
  CategorySeedService,
  MediaSeedService,
  CarouselBannersSeedService,
  UserAddressSeedService,
  ShoppingCartSeedService,
  ReviewsSeedService,
  FeaturedProductsSeedService,
  ShippingSeedService,
  SalesOrderSeedService,
  SalesReportDemoOrdersSeedService,
  FranchiseSeedService,
  EkumpraProductSeedService,
  CurrenciesSeedService,
  SubscriptionPlansSeedService,
  ServiceCategoriesSeedService,
  UserAddressesSeedService,
  ProductTagsSeedService,
  NotificationsSeedService,
  ServiceGallerySeedService,
  StoreUnavailabilitySeedService,
  ServicePackagesSeedService,
  ServiceMilestoneTemplatesSeedService,
  CancellationPoliciesSeedService,
  BookingsSeedService,
  SellerPendingBookingsSeedService,
  BookingMilestonesSeedService,
  BookingCancellationsSeedService,
  CheckoutPaymentsSeedService,
  EscrowTransactionsSeedService,
  SellerEarningsSeedService,
  SellerPayoutsSeedService,
  SellerPayoutAccountsSeedService,
  ReturnRequestSeedService,
  ModerationSeedService,
  InvoiceSeedService,
  BankSeedService,
  BankAccountSeedService,
  UserGroupSeedService,
  BookingApproversUserGroupSeedService,
  UserPermissionSeedService,
  UserAssignmentSeedService,
  // MepfServicesSeedService, // DEPRECATED
  AnjoWorldSeedService,
  ServiceLocationBrandsSeedService,
};

const rollbackSeed = async (
  app: INestApplication,
  seedRunner: SeedRunnerService,
  seedName: string,
): Promise<boolean> => {
  const ServiceClass = seedServiceMap[seedName];

  if (!ServiceClass) {
    console.warn(
      `Warning: ${seedName} not found in service map. Removing record only.`,
    );
    await seedRunner.removeSeedRecord(seedName);
    return true;
  }

  const seedService: ISeedService = app.get(ServiceClass);

  if (typeof seedService.down !== 'function') {
    console.warn(
      `Warning: ${seedName}.down() not implemented. Removing record only.`,
    );
    await seedRunner.removeSeedRecord(seedName);
    return true;
  }

  try {
    console.log(`Rolling back: ${seedName}`);
    await seedService.down();
    await seedRunner.removeSeedRecord(seedName);
    console.log(`Rolled back: ${seedName}`);
    return true;
  } catch (error) {
    console.error(`Failed to rollback ${seedName}:`, error);
    return false;
  }
};

const runSeedDown = async () => {
  const targetSeed = process.argv[2];
  const app = await NestFactory.create(SeedModule);
  const seedRunner = app.get(SeedRunnerService);
  const dataSource = app.get(DataSource);

  try {
    // Disable FK checks on all tables (like Laravel's Schema::disableForeignKeyChecks)
    // session_replication_role is connection-scoped and won't apply across
    // pooled connections, so we disable triggers per-table instead.
    const tables = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    for (const { tablename } of tables) {
      await dataSource.query(
        `ALTER TABLE "public"."${tablename}" DISABLE TRIGGER ALL`,
      );
    }

    const failures: string[] = [];

    if (targetSeed === '--all') {
      // Roll back all batches from latest to earliest
      let lastBatchSeeds = await seedRunner.getLastBatchSeeds();

      while (lastBatchSeeds.length > 0) {
        const batchNumber = lastBatchSeeds[0].batch;
        console.log(
          `Rolling back batch ${batchNumber} (${lastBatchSeeds.length} seeds)...`,
        );

        for (const seedRecord of lastBatchSeeds) {
          const success = await rollbackSeed(app, seedRunner, seedRecord.name);
          if (!success) failures.push(seedRecord.name);
        }

        const nextBatchSeeds = await seedRunner.getLastBatchSeeds();

        // Stop if stuck on the same batch (failed seeds weren't removed)
        if (
          nextBatchSeeds.length > 0 &&
          nextBatchSeeds[0].batch === batchNumber
        ) {
          console.error(`Cannot progress past batch ${batchNumber}. Stopping.`);
          break;
        }

        lastBatchSeeds = nextBatchSeeds;
      }
    } else if (targetSeed) {
      // Roll back a specific seed
      const allSeeds = await seedRunner.getAllSeeds();
      const seedRecord = allSeeds.find((s) => s.name === targetSeed);

      if (!seedRecord) {
        console.log(`Seed "${targetSeed}" not found in seed_migrations.`);
        console.log('Available seeds:', allSeeds.map((s) => s.name).join(', '));
        return;
      }

      const success = await rollbackSeed(app, seedRunner, targetSeed);
      if (!success) failures.push(targetSeed);
    } else {
      // Roll back last batch
      const lastBatchSeeds = await seedRunner.getLastBatchSeeds();

      if (lastBatchSeeds.length === 0) {
        console.log('No seeds to rollback.');
        return;
      }

      console.log(
        `Rolling back batch ${lastBatchSeeds[0].batch} (${lastBatchSeeds.length} seeds)...`,
      );

      for (const seedRecord of lastBatchSeeds) {
        const success = await rollbackSeed(app, seedRunner, seedRecord.name);
        if (!success) failures.push(seedRecord.name);
      }
    }

    if (failures.length > 0) {
      console.error(
        `Rollback completed with ${failures.length} failure(s): ${failures.join(', ')}`,
      );
      process.exitCode = 1;
    } else {
      console.log('Rollback completed successfully.');
    }
  } finally {
    // Re-enable FK checks on all tables
    const tables = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    for (const { tablename } of tables) {
      await dataSource.query(
        `ALTER TABLE "public"."${tablename}" ENABLE TRIGGER ALL`,
      );
    }
    await app.close();
  }
};

void runSeedDown();
