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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';
import { PermissionSeedService } from './permission/permission-seed.service';
import { RoleSeedService } from './role/role-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { TimeEntrySeedService } from './time-entry/time-entry-seed.service';
import { WorkScheduleSeedService } from './work-schedule/work-schedule-seed.service';

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
    TypeOrmModule.forFeature([
      PermissionEntity,
      RoleEntity,
      UserEntity,
      TimeEntryEntity,
      WorkScheduleEntity,
      LeaveAllocationEntity,
    ]),
  ],
  providers: [
    PermissionSeedService,
    RoleSeedService,
    UserSeedService,
    TimeEntrySeedService,
    WorkScheduleSeedService,
  ],
  exports: [
    PermissionSeedService,
    RoleSeedService,
    UserSeedService,
    TimeEntrySeedService,
    WorkScheduleSeedService,
  ],
})
export class SeedModule {}
