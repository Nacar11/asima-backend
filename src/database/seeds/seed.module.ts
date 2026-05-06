import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import appConfig from '@/config/app.config';
import databaseConfig from '@/database/config/database.config';
import authConfig from '@/auth/config/auth.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { PermissionSeedService } from './permission/permission-seed.service';
import { RoleSeedService } from './role/role-seed.service';

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
    TypeOrmModule.forFeature([PermissionEntity, RoleEntity]),
  ],
  providers: [PermissionSeedService, RoleSeedService],
  exports: [PermissionSeedService, RoleSeedService],
})
export class SeedModule {}
