import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedModule } from './seed.module';
import { SeedRunnerService } from './seed-runner/seed-runner.service';
import { Repository } from 'typeorm';
import { SeedMigrationEntity } from './seed-migration/seed-migration.entity';

const seedNames = [
  'UserSeedService',
  'UserDetailSeedService',
  'RoleSeedService',
  'StatusSeedService',
  'MenuSeedService',
  'SellerSeedService',
  'TagSeedService',
  'CategorySeedService',
  'MediaSeedService',
  'CarouselBannersSeedService',
  'UserAddressSeedService',
  'ShoppingCartSeedService',
  'ReviewsSeedService',
  'FeaturedProductsSeedService',
  'ShippingSeedService',
  'SalesOrderSeedService',
  'SalesReportDemoOrdersSeedService',
  'FranchiseSeedService',
  'EkumpraProductSeedService',
  'CurrenciesSeedService',
  'SubscriptionPlansSeedService',
  'ServiceCategoriesSeedService',
  'UserAddressesSeedService',
  'ProductTagsSeedService',
  'NotificationsSeedService',
  'ServiceGallerySeedService',
  'StoreUnavailabilitySeedService',
  'ServicePackagesSeedService',
  'ServiceMilestoneTemplatesSeedService',
  'CancellationPoliciesSeedService',
  'BookingsSeedService',
  'SellerPendingBookingsSeedService',
  'BookingMilestonesSeedService',
  'BookingCancellationsSeedService',
  'CheckoutPaymentsSeedService',
  'EscrowTransactionsSeedService',
  'SellerEarningsSeedService',
  'SellerPayoutsSeedService',
  'SellerPayoutAccountsSeedService',
  'ReturnRequestSeedService',
  'ModerationSeedService',
  'InvoiceSeedService',
  'BankSeedService',
  'BankAccountSeedService',
  'UserGroupSeedService',
  'UserPermissionSeedService',
  'UserAssignmentSeedService',
  'AnjoWorldSeedService',
];

const bootstrapSeedTracking = async () => {
  const app = await NestFactory.create(SeedModule);

  const seedRunner = app.get(SeedRunnerService);
  const seedMigrationRepository = app.get<Repository<SeedMigrationEntity>>(
    getRepositoryToken(SeedMigrationEntity),
  );

  console.log('\n=== Bootstrapping Seed Tracking for Existing Database ===\n');

  const existingSeeds = await seedRunner.getAllSeeds();

  if (existingSeeds.length > 0) {
    console.log(
      `Found ${existingSeeds.length} existing seed records. This database already has seed tracking.`,
    );
    console.log('Aborting bootstrap to avoid duplicate records.\n');
    await app.close();
    return;
  }

  console.log(
    `Marking ${seedNames.length} seeds as executed in batch 0 (bootstrap)...\n`,
  );

  for (const seedName of seedNames) {
    await seedMigrationRepository.save({
      name: seedName,
      batch: 0,
    });
    console.log(`  ✓ ${seedName}`);
  }

  console.log('\nBootstrap completed. All existing seeds marked as batch 0.\n');
  console.log(
    'Note: Seeds in batch 0 represent pre-tracked seeds. They will be skipped',
  );
  console.log(
    'on future seed:up runs. Use seed:down cautiously as it will attempt to',
  );
  console.log('rollback these seeds if they are the last batch.\n');

  await app.close();
};

void bootstrapSeedTracking();
