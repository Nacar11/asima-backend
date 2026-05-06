import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import appConfig from '@/config/app.config';
import databaseConfig from '@/database/config/database.config';
import authConfig from '@/auth/config/auth.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import { HealthModule } from '@/health/health.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { RolesModule } from '@/roles/roles.module';
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
    HealthModule,
    PermissionsModule,
    RolesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
