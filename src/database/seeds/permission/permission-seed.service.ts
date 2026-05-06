import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';

type PermissionSeedRow = {
  code: string;
  resource: string;
  action: string;
  description: string | null;
};

@Injectable()
export class PermissionSeedService {
  private readonly logger = new Logger(PermissionSeedService.name);

  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repo: Repository<PermissionEntity>,
  ) {}

  async run(): Promise<{ inserted: number; updated: number }> {
    const rows = this.loadManifest();

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await this.repo.findOne({ where: { code: row.code } });
      if (existing) {
        const drifted =
          existing.resource !== row.resource ||
          existing.action !== row.action ||
          existing.description !== row.description;
        if (drifted) {
          existing.resource = row.resource;
          existing.action = row.action;
          existing.description = row.description;
          await this.repo.save(existing);
          updated += 1;
        }
      } else {
        await this.repo.save(this.repo.create(row));
        inserted += 1;
      }
    }

    this.logger.log(
      `Permissions seed complete: ${inserted} inserted, ${updated} updated, ${rows.length} total`,
    );
    return { inserted, updated };
  }

  private loadManifest(): PermissionSeedRow[] {
    const manifestPath = path.join(__dirname, '..', 'data', 'permissions.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw) as PermissionSeedRow[];
  }
}
