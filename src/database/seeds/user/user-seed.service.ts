import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { BCRYPT_ROUNDS } from '@/users/users.constants';

type UserSeedRow = {
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  role_name: string;
  system_admin?: boolean;
  is_active?: boolean;
};

type UsersManifest = {
  _doc?: string;
  users: UserSeedRow[];
};

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  async run(): Promise<void> {
    const rows = this.loadManifest();
    const password = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const roles = await this.roleRepo.find();
    const roleByName = new Map(roles.map((r) => [r.name, r]));

    let inserted = 0;
    let skipped = 0;
    const missingRoles = new Set<string>();

    for (const row of rows) {
      const role = roleByName.get(row.role_name);
      if (!role) {
        missingRoles.add(row.role_name);
        continue;
      }

      const email = row.email.trim().toLowerCase();
      const existing = await this.userRepo.findOne({ where: { email } });
      if (existing) {
        skipped += 1;
        continue;
      }

      const entity = this.userRepo.create({
        email,
        password_hash: hash,
        first_name: row.first_name,
        last_name: row.last_name,
        title: row.title ?? null,
        role_id: role.id,
        system_admin: row.system_admin ?? false,
        is_active: row.is_active ?? true,
      });
      await this.userRepo.save(entity);
      inserted += 1;
      this.logger.log(`  + ${email} (${row.role_name})`);
    }

    if (missingRoles.size > 0) {
      this.logger.warn(
        `Skipped users referencing unknown roles: ${[...missingRoles].join(', ')} — ` +
          `make sure the role-seed step ran first and that names match exactly.`,
      );
    }

    this.logger.log(
      `Users seed complete: ${inserted} inserted, ${skipped} already existed, ` +
        `${missingRoles.size} role(s) unresolved`,
    );

    if (inserted > 0) {
      this.logger.log(
        `Default password for newly seeded accounts is the value of SEED_DEFAULT_PASSWORD ` +
          `(falls back to 'Asima@1234'). Existing users were NOT touched.`,
      );
    }
  }

  private loadManifest(): UserSeedRow[] {
    const manifestPath = path.join(__dirname, '..', 'data', 'users.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as UsersManifest;
    if (!Array.isArray(parsed.users)) {
      throw new Error('users.json: expected a top-level "users" array');
    }
    return parsed.users;
  }
}
