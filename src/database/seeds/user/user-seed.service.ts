import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';
import {
  ALLOCATION_SOURCES,
  DEFAULT_LEAVE_ALLOCATIONS,
} from '@/leave-allocations/leave-allocations.constants';
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
    @InjectRepository(LeaveAllocationEntity)
    private readonly allocationRepo: Repository<LeaveAllocationEntity>,
  ) {}

  async run(): Promise<void> {
    const rows = this.loadManifest();
    // `Asima@1234` satisfies the PASSWORD_COMPLEXITY_REGEX policy
    // applied to runtime DTOs (lower + upper + digit + symbol). When
    // overriding via SEED_DEFAULT_PASSWORD, keep the same shape so a
    // seeded user can immediately log in and rotate via
    // PATCH /users/me/password.
    const password = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const roles = await this.roleRepo.find();
    const roleByName = new Map(roles.map((r) => [r.name, r]));

    let inserted = 0;
    let skipped = 0;
    let allocationsInserted = 0;
    const missingRoles = new Set<string>();

    for (const row of rows) {
      const role = roleByName.get(row.role_name);
      if (!role) {
        missingRoles.add(row.role_name);
        continue;
      }

      const email = row.email.trim().toLowerCase();
      // Uniqueness is case-insensitive at the DB level
      // (`users_email_lower_uq … WHERE deleted_at IS NULL`). Match the
      // same predicate here so re-runs after a soft-delete don't try
      // to re-insert a row the partial index still permits but the
      // operator probably didn't mean to recreate. `withDeleted: true`
      // keeps the seed conservative — if a soft-deleted row carries
      // the same email, leave it alone.
      const existing = await this.userRepo.findOne({
        where: { email },
        withDeleted: true,
      });

      let user: UserEntity;
      if (existing) {
        skipped += 1;
        // Leave soft-deleted rows entirely alone (don't resurrect balances).
        if (existing.deleted_at) continue;
        user = existing;
      } else {
        user = await this.userRepo.save(
          this.userRepo.create({
            email,
            password_hash: hash,
            first_name: row.first_name,
            last_name: row.last_name,
            title: row.title ?? null,
            role_id: role.id,
            system_admin: row.system_admin ?? false,
            is_active: row.is_active ?? true,
          }),
        );
        inserted += 1;
        this.logger.log(`  + ${email} (${row.role_name})`);
      }

      // Every active employee starts with the default leave balances. Backfills
      // pre-existing users too; idempotent by (employee_id, leave_type,
      // source='default'), so re-runs are a no-op.
      allocationsInserted += await this.ensureDefaultAllocations(user.id);
    }

    if (missingRoles.size > 0) {
      this.logger.warn(
        `Skipped users referencing unknown roles: ${[...missingRoles].join(', ')} — ` +
          `make sure the role-seed step ran first and that names match exactly.`,
      );
    }

    this.logger.log(
      `Users seed complete: ${inserted} inserted, ${skipped} already existed, ` +
        `${allocationsInserted} default leave allocation(s) added, ` +
        `${missingRoles.size} role(s) unresolved`,
    );

    if (inserted > 0) {
      this.logger.log(
        `Default password for newly seeded accounts is the value of SEED_DEFAULT_PASSWORD ` +
          `(falls back to 'Asima@1234'). Existing users were NOT touched.`,
      );
    }
  }

  /**
   * Ensure the employee has the default leave allocations (10 vacation, 10
   * sick). Idempotent by natural key `(employee_id, leave_type,
   * source='default')` — only inserts the rows that are missing. Returns the
   * number of rows inserted.
   */
  private async ensureDefaultAllocations(employee_id: number): Promise<number> {
    let added = 0;
    for (const { leave_type, amount } of DEFAULT_LEAVE_ALLOCATIONS) {
      const exists = await this.allocationRepo.findOne({
        where: { employee_id, leave_type, source: ALLOCATION_SOURCES.default },
        withDeleted: true,
      });
      if (exists) continue;
      await this.allocationRepo.save(
        this.allocationRepo.create({
          employee_id,
          leave_type,
          amount,
          source: ALLOCATION_SOURCES.default,
        }),
      );
      added += 1;
    }
    return added;
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
