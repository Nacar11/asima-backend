import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import { TIME_ENTRY_SOURCES, TIME_ENTRY_STATUSES } from '@/time-entries/time-entries.constants';

/**
 * The three weekdays before "today" (today = 2026-05-07 / Thursday) — so
 * Mon/Tue/Wed of 2026-04-27..29. Hardcoded rather than computed-from-now
 * because seed reproducibility matters more than date-relative cleverness:
 * the e2e tests want a known set of dates to query against.
 */
const SEED_WORK_DATES = ['2026-04-27', '2026-04-28', '2026-04-29'] as const;
const PUNCH_IN_HOUR = 9;
const PUNCH_OUT_HOUR = 18;

@Injectable()
export class TimeEntrySeedService {
  private readonly logger = new Logger(TimeEntrySeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TimeEntryEntity)
    private readonly timeEntryRepo: Repository<TimeEntryEntity>,
  ) {}

  async run(): Promise<void> {
    const employees = await this.userRepo.find({
      where: { system_admin: false },
    });
    const admin = await this.userRepo.findOne({ where: { system_admin: true } });
    const created_by = admin?.id ?? null;

    let inserted = 0;
    let skipped = 0;

    for (const employee of employees) {
      for (const work_date of SEED_WORK_DATES) {
        const existing = await this.timeEntryRepo.findOne({
          where: { employee_id: employee.id, work_date },
        });
        if (existing) {
          skipped += 1;
          continue;
        }

        const time_in = buildPunch(work_date, PUNCH_IN_HOUR);
        const time_out = buildPunch(work_date, PUNCH_OUT_HOUR);

        const entity = this.timeEntryRepo.create({
          employee_id: employee.id,
          work_date,
          time_in,
          time_out,
          source: TIME_ENTRY_SOURCES.admin,
          status: TIME_ENTRY_STATUSES.confirmed,
          created_by,
          updated_by: created_by,
        });
        await this.timeEntryRepo.save(entity);
        inserted += 1;
      }
    }

    this.logger.log(
      `TimeEntries seed complete: ${inserted} inserted, ${skipped} already existed ` +
        `(employees seeded: ${employees.length}, dates: ${SEED_WORK_DATES.length})`,
    );
  }
}

function buildPunch(work_date: string, hourUtc: number): Date {
  // ISO 8601 with explicit Z so behaviour doesn't drift with TZ env.
  return new Date(`${work_date}T${String(hourUtc).padStart(2, '0')}:00:00Z`);
}
