import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import appConfig from '@/config/app.config';
import databaseConfig from '@/database/config/database.config';
import authConfig from '@/auth/config/auth.config';
import storageConfig from '@/storage/config/storage.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import { AuthModule } from '@/auth/auth.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { HealthModule } from '@/health/health.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PermissionsGuard } from '@/permissions/permissions.guard';
import { RolesModule } from '@/roles/roles.module';
import { UsersModule } from '@/users/users.module';
import { TimeEntriesModule } from '@/time-entries/time-entries.module';
import { WorkSchedulesModule } from '@/work-schedules/work-schedules.module';
import { ApprovalsModule } from '@/approvals/approvals.module';
import { ApprovalChainsModule } from '@/approval-chains/approval-chains.module';
import { LeaveRequestsModule } from '@/leave-requests/leave-requests.module';
import { LeaveAllocationsModule } from '@/leave-allocations/leave-allocations.module';
import { TimeCorrectionRequestsModule } from '@/time-correction-requests/time-correction-requests.module';
import { RequestIdMiddleware } from '@/utils/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, storageConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
    // ONE global throttler — `default` — see asima-backend/CLAUDE.md
    // "Auth & guards". Tighter per-route limits (login, refresh, password
    // rotation) are expressed as @Throttle({ default: { limit } }) OVERRIDES
    // of this default on those handlers, NOT as separate named throttlers.
    //
    // Why: every throttler listed here applies to EVERY route. Defining
    // `login`/`refresh`/`password` as additional global tiers silently
    // capped the whole app at the tightest one (5/min), and made
    // @SkipThrottle() — which only skips `default` — unable to fully exempt
    // a route. Keeping a single global tier makes @SkipThrottle() work and
    // confines the strict limits to the routes that opt in via @Throttle.
    //
    // E2E logs in repeatedly; when THROTTLE_DISABLED is set (CI + local
    // e2e) the limit is bumped out of reach. Production must NEVER set it.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: process.env.THROTTLE_DISABLED === 'true' ? 100_000 : 300,
      },
    ]),
    AuthModule,
    HealthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    TimeEntriesModule,
    WorkSchedulesModule,
    ApprovalsModule,
    ApprovalChainsModule,
    LeaveRequestsModule,
    LeaveAllocationsModule,
    TimeCorrectionRequestsModule,
  ],
  // Guard pipeline runs in declared order:
  //   1. ThrottlerGuard   — rate limit before paying any auth cost
  //   2. JwtAuthGuard     — populates req.user; honors @Public()
  //   3. PermissionsGuard — checks @Permissions() metadata; passes if absent
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
