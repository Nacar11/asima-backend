import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedRunnerService } from './seed-runner/seed-runner.service';
import { UserSeedService } from './user/user-seed.service';
import { RoleSeedService } from './role/role-seed.service';
import { StatusSeedService } from './status/status-seed.service';
import { MenuSeedService } from './menu/menu-seed.service';
import { UserGroupSeedService } from './user-group/user-group-seed.service';
import { UserPermissionSeedService } from './user-permission/user-permission-seed.service';
import { UserAssignmentSeedService } from './user-assignment/user-assignment-seed.service';
import { CurrenciesSeedService } from './currencies/currencies-seed.service';
import { ServiceCategoriesSeedService } from './service-categories/service-categories-seed.service';
import { SubscriptionPlansSeedService } from './subscription-plans/subscription-plans-seed.service';
import { PaymentGatewaySettingsSeedService } from './payment-gateway-settings/payment-gateway-settings-seed.service';
import { AnjoWorldSeedService } from './anjo-world/anjo-world-seed.service';
import { TambayanServicesSeedService } from './tambayan-services/tambayan-services-seed.service';
import { EdistrictSeedService } from './edistrict/edistrict-seed.service';
import { BookingApproversUserGroupSeedService } from './booking-approvers-user-group/booking-approvers-user-group-seed.service';

const runQaIndependentMerchantSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  const seedRunner = app.get(SeedRunnerService);

  await seedRunner.runSeed([
    app.get(UserSeedService),
    app.get(RoleSeedService),
    app.get(StatusSeedService),
    app.get(MenuSeedService),
    app.get(UserGroupSeedService),
    app.get(UserPermissionSeedService),
    app.get(UserAssignmentSeedService),
  ]);

  await seedRunner.runSeed([
    app.get(CurrenciesSeedService),
    app.get(ServiceCategoriesSeedService),
    app.get(SubscriptionPlansSeedService),
    app.get(PaymentGatewaySettingsSeedService),
  ]);

  await seedRunner.runSeed([
    app.get(AnjoWorldSeedService),
    app.get(TambayanServicesSeedService),
  ]);

  await seedRunner.runSeed([
    app.get(EdistrictSeedService),
    app.get(BookingApproversUserGroupSeedService),
  ]);

  console.log(
    '✅ Minimal QA seed completed for independent pickleball merchant testing.',
  );

  await app.close();
};

void runQaIndependentMerchantSeed();
