import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import appConfig from '@/config/app.config';
import databaseConfig from '@/database/config/database.config';
import authConfig from '@/auth/config/auth.config';
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
import { RequestIdMiddleware } from '@/utils/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
    // Named tiers — see asima-backend/CLAUDE.md "Auth & guards".
    // `default` covers everything globally; the named tiers are
    // applied per-route via @Throttle. `password` covers any endpoint
    // that does a password compare or rotation (PATCH /users/me/password,
    // POST /admin/users/:id/reset-password) to throttle session-hijack
    // brute-force.
    //
    // E2E tests against the global JwtAuthGuard need to log in repeatedly
    // and would otherwise hit the 10/min login wall. When THROTTLE_DISABLED
    // is set (CI + local e2e), every tier is bumped to an effectively
    // unreachable limit. Production must NEVER set this.
    ThrottlerModule.forRoot(
      process.env.THROTTLE_DISABLED === 'true'
        ? [{ name: 'default', ttl: 60_000, limit: 100_000 }]
        : [
            { name: 'default', ttl: 60_000, limit: 300 },
            { name: 'login', ttl: 60_000, limit: 10 },
            { name: 'refresh', ttl: 60_000, limit: 20 },
            { name: 'password', ttl: 60_000, limit: 5 },
          ],
    ),
    AuthModule,
    HealthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    TimeEntriesModule,
    WorkSchedulesModule,
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
