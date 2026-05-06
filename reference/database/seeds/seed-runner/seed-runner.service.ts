import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedMigrationEntity } from '../seed-migration/seed-migration.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class SeedRunnerService {
  private readonly logger = new Logger(SeedRunnerService.name);

  constructor(
    @InjectRepository(SeedMigrationEntity)
    private readonly seedMigrationRepository: Repository<SeedMigrationEntity>,
  ) {}

  async runSeed(seedServices: ISeedService | ISeedService[]): Promise<void> {
    const services = Array.isArray(seedServices)
      ? seedServices
      : [seedServices];

    const batch = await this.getNextBatch();

    for (const seedService of services) {
      const seedName = seedService.constructor.name;

      const existingRecord = await this.seedMigrationRepository.findOne({
        where: { name: seedName },
      });

      if (existingRecord) {
        this.logger.log(
          `Skipping ${seedName} - already executed in batch ${existingRecord.batch}`,
        );
        continue;
      }

      this.logger.log(`Running seed: ${seedName}`);
      await seedService.run();

      await this.seedMigrationRepository.save({
        name: seedName,
        batch,
      });

      this.logger.log(`Completed seed: ${seedName} (batch ${batch})`);
    }
  }

  async getNextBatch(): Promise<number> {
    const result = await this.seedMigrationRepository
      .createQueryBuilder('seed')
      .select('MAX(seed.batch)', 'maxBatch')
      .getRawOne();

    return (result?.maxBatch ?? 0) + 1;
  }

  async getLastBatchSeeds(): Promise<SeedMigrationEntity[]> {
    const maxBatch = await this.seedMigrationRepository
      .createQueryBuilder('seed')
      .select('MAX(seed.batch)', 'maxBatch')
      .getRawOne();

    if (!maxBatch?.maxBatch) {
      return [];
    }

    return this.seedMigrationRepository.find({
      where: { batch: maxBatch.maxBatch },
      order: { id: 'DESC' },
    });
  }

  async removeSeedRecord(seedName: string): Promise<void> {
    await this.seedMigrationRepository.delete({ name: seedName });
    this.logger.log(`Removed seed record: ${seedName}`);
  }

  async getAllSeeds(): Promise<SeedMigrationEntity[]> {
    return this.seedMigrationRepository.find({
      order: { batch: 'ASC', id: 'ASC' },
    });
  }
}
