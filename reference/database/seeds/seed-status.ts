import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedRunnerService } from './seed-runner/seed-runner.service';

const seedStatus = async () => {
  const app = await NestFactory.create(SeedModule);

  const seedRunner = app.get(SeedRunnerService);
  const allSeeds = await seedRunner.getAllSeeds();

  if (allSeeds.length === 0) {
    console.log('No seeds have been executed yet.');
    await app.close();
    return;
  }

  console.log('\n=== Seeder Status ===\n');

  const seedsByBatch = allSeeds.reduce(
    (acc, seed) => {
      if (!acc[seed.batch]) {
        acc[seed.batch] = [];
      }
      acc[seed.batch].push(seed);
      return acc;
    },
    {} as Record<number, typeof allSeeds>,
  );

  Object.keys(seedsByBatch)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((batchKey) => {
      const batch = Number(batchKey);
      const seeds = seedsByBatch[batch];

      console.log(`Batch ${batch}:`);
      seeds.forEach((seed) => {
        const executedAt = new Date(seed.executed_at).toLocaleString();
        console.log(`  - ${seed.name} (executed: ${executedAt})`);
      });
      console.log('');
    });

  console.log(`Total seeds executed: ${allSeeds.length}\n`);

  await app.close();
};

void seedStatus();
