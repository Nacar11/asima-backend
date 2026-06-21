import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CompensationEntity } from '@/compensation/persistence/entities/compensation.entity';
import { deriveHourlyRate } from '@/compensation/compensation.constants';

type CompensationSeedRow = {
  email: string;
  monthly_salary: number;
  /** Optional override — when present the row is marked overridden. */
  hourly_rate?: number;
  effective_from: string;
  /** Set for an already-ended historical row (e.g. the Liam history example). */
  effective_to?: string;
};

type CompensationManifest = {
  _doc?: string;
  compensations: CompensationSeedRow[];
};

/**
 * Seeds compensation rows for seeded users so downstream OT/DTR dev has rates
 * to compute on. Idempotent on the natural key `(employee_id, effective_from)`
 * — re-running skips existing rows and never touches already-ended ones (same
 * approach as WorkScheduleSeedService). `hourly_rate` is derived unless the
 * manifest supplies an override.
 */
@Injectable()
export class CompensationSeedService {
  private readonly logger = new Logger(CompensationSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CompensationEntity)
    private readonly compRepo: Repository<CompensationEntity>,
  ) {}

  async run(): Promise<void> {
    const rows = this.loadManifest();
    const admin = await this.userRepo.findOne({ where: { system_admin: true } });
    const created_by = admin?.id ?? null;

    const users = await this.userRepo.find();
    const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    let inserted = 0;
    let skipped = 0;
    const missing = new Set<string>();

    for (const row of rows) {
      const user = userByEmail.get(row.email.trim().toLowerCase());
      if (!user) {
        missing.add(row.email);
        continue;
      }

      const existing = await this.compRepo.findOne({
        where: { employee_id: user.id, effective_from: row.effective_from },
        withDeleted: true,
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const overridden = row.hourly_rate != null;
      const hourly_rate = overridden ? row.hourly_rate! : deriveHourlyRate(row.monthly_salary);

      await this.compRepo.save(
        this.compRepo.create({
          employee_id: user.id,
          monthly_salary: row.monthly_salary,
          hourly_rate,
          hourly_rate_is_overridden: overridden,
          effective_from: row.effective_from,
          effective_to: row.effective_to ?? null,
          created_by,
          updated_by: created_by,
        }),
      );
      inserted += 1;
    }

    if (missing.size > 0) {
      this.logger.warn(
        `Skipped compensation rows referencing unknown emails: ${[...missing].join(', ')} — ` +
          `make sure the user-seed step ran first.`,
      );
    }

    this.logger.log(
      `Compensation seed complete: ${inserted} inserted, ${skipped} already existed ` +
        `(${missing.size} unresolved email(s))`,
    );
  }

  private loadManifest(): CompensationSeedRow[] {
    const manifestPath = path.join(__dirname, '..', 'data', 'compensation.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as CompensationManifest;
    if (!Array.isArray(parsed.compensations)) {
      throw new Error('compensation.json: expected a top-level "compensations" array');
    }
    return parsed.compensations;
  }
}
