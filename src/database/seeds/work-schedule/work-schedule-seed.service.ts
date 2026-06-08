import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';
import { DAY_OF_WEEK, DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * Seeds a Mon–Fri 09:00–18:00 / 60-min-break schedule for every
 * non-`system_admin` user. Idempotent on the natural key
 * `(employee_id, day_of_week, effective_from)` — re-running the seed
 * does NOT insert duplicates and does NOT touch already-ended rows.
 */
const SEED_EFFECTIVE_FROM = '2026-05-23';
const PUNCH_IN = '09:00:00';
const PUNCH_OUT = '18:00:00';
const BREAK_MINUTES = 60;
const BREAK_START = '12:00:00';

const WORK_DAYS: DayOfWeek[] = [
  DAY_OF_WEEK.MONDAY,
  DAY_OF_WEEK.TUESDAY,
  DAY_OF_WEEK.WEDNESDAY,
  DAY_OF_WEEK.THURSDAY,
  DAY_OF_WEEK.FRIDAY,
];

@Injectable()
export class WorkScheduleSeedService {
  private readonly logger = new Logger(WorkScheduleSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(WorkScheduleEntity)
    private readonly scheduleRepo: Repository<WorkScheduleEntity>,
  ) {}

  async run(): Promise<void> {
    const employees = await this.userRepo.find({ where: { system_admin: false } });
    const admin = await this.userRepo.findOne({ where: { system_admin: true } });
    const created_by = admin?.id ?? null;

    let inserted = 0;
    let skipped = 0;

    for (const employee of employees) {
      for (const day_of_week of WORK_DAYS) {
        const existing = await this.scheduleRepo.findOne({
          where: {
            employee_id: employee.id,
            day_of_week,
            // Match on effective_from for true idempotency. If the seed
            // dates change, this skips the OLD seed rows (correct — we
            // don't want to ressurrect retired schedules) and inserts
            // the new ones.
            effective_from: SEED_EFFECTIVE_FROM,
            effective_to: IsNull(),
          },
        });
        if (existing) {
          skipped += 1;
          continue;
        }

        const entity = this.scheduleRepo.create({
          employee_id: employee.id,
          day_of_week,
          expected_in: PUNCH_IN,
          expected_out: PUNCH_OUT,
          break_minutes: BREAK_MINUTES,
          break_start: BREAK_START,
          effective_from: SEED_EFFECTIVE_FROM,
          effective_to: null,
          created_by,
          updated_by: created_by,
        });
        await this.scheduleRepo.save(entity);
        inserted += 1;
      }
    }

    this.logger.log(
      `WorkSchedules seed complete: ${inserted} inserted, ${skipped} already existed ` +
        `(employees seeded: ${employees.length}, weekdays: ${WORK_DAYS.length})`,
    );
  }
}
