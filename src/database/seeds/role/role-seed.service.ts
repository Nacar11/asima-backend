import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';

type RoleSeedRow = {
  name: string;
  description: string | null;
  /** Either '*' (= grant every permission) or an explicit list of codes. */
  permission_codes: '*' | string[];
};

@Injectable()
export class RoleSeedService {
  private readonly logger = new Logger(RoleSeedService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
  ) {}

  async run(): Promise<void> {
    const rows = this.loadManifest();
    const allPermissions = await this.permissionRepo.find();

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const desired =
        row.permission_codes === '*'
          ? allPermissions
          : allPermissions.filter((p) => row.permission_codes.includes(p.code));

      const existing = await this.roleRepo.findOne({
        where: { name: row.name },
        relations: ['permissions'],
      });

      if (existing) {
        existing.description = row.description;
        existing.permissions = desired;
        await this.roleRepo.save(existing);
        updated += 1;
      } else {
        const entity = this.roleRepo.create({
          name: row.name,
          description: row.description,
          permissions: desired,
        });
        await this.roleRepo.save(entity);
        inserted += 1;
      }
      this.logger.log(`  ${row.name}: ${desired.length} permissions`);
    }

    this.logger.log(`Roles seed complete: ${inserted} inserted, ${updated} updated`);
  }

  private loadManifest(): RoleSeedRow[] {
    const manifestPath = path.join(__dirname, '..', 'data', 'roles.json');
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RoleSeedRow[];
  }
}
