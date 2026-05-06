import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedMigrationEntity } from '../seed-migration/seed-migration.entity';
import { SeedRunnerService } from './seed-runner.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeedMigrationEntity])],
  providers: [SeedRunnerService],
  exports: [SeedRunnerService],
})
export class SeedRunnerModule {}
