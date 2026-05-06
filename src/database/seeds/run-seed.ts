import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { PermissionSeedService } from './permission/permission-seed.service';

async function runSeed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    await app.get(PermissionSeedService).run();
    logger.log('All seeds complete');
  } catch (err) {
    logger.error('Seed failed', err instanceof Error ? err.stack : String(err));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void runSeed();
