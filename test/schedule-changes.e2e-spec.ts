import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_VERSION } from '../src/utils/constants/api.constants';
import validationOptions from '../src/utils/validation-options';
import { PermissionSeedService } from '../src/database/seeds/permission/permission-seed.service';
import { RoleSeedService } from '../src/database/seeds/role/role-seed.service';
import { UserSeedService } from '../src/database/seeds/user/user-seed.service';
import { PermissionEntity } from '../src/permissions/persistence/entities/permission.entity';
import { RoleEntity } from '../src/roles/persistence/entities/role.entity';
import { UserEntity } from '../src/users/persistence/entities/user.entity';
import { LeaveAllocationEntity } from '../src/leave-allocations/persistence/entities/leave-allocation.entity';

const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';
const ADMIN = { email: 'admin@asima.inc', password: SEED_PASSWORD };
const EMPLOYEE = { email: 'emma_thompson@asima.inc', password: SEED_PASSWORD };

/** A future date (>= minAhead days out) that lands on `weekday` (0=Sun..6=Sat), as YYYY-MM-DD. */
function futureDate(weekday: number, minAhead = 14): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + minAhead);
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function offsetToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('Schedule Changes — cascade (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let adminId: number;
  let employeeId: number;

  const MON = futureDate(1); // governed Monday in the future
  const TUE = futureDate(2); // governed Tuesday in the future
  const url = (p: string) => `/api/v${API_VERSION}${p}`;
  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);

  async function insertLeave(over: {
    start_date: string;
    end_date: string;
    day_portion?: string;
    working_days?: number;
    status?: string;
  }): Promise<number> {
    const rows = await dataSource.query(
      `INSERT INTO leave_requests
         (employee_id, leave_type, start_date, end_date, working_days, day_portion, status, l1_approver_id)
       VALUES ($1,'vacation',$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        employeeId,
        over.start_date,
        over.end_date,
        over.working_days ?? 1,
        over.day_portion ?? 'full',
        over.status ?? 'approved',
        adminId,
      ],
    );
    return rows[0].id;
  }

  async function insertCorrection(work_date: string, status = 'approved'): Promise<number> {
    const rows = await dataSource.query(
      `INSERT INTO time_correction_requests
         (employee_id, work_date, proposed_time_in, reason, status, l1_approver_id)
       VALUES ($1,$2,$3,'e2e',$4,$5) RETURNING id`,
      [employeeId, work_date, `${work_date}T09:00:00Z`, status, adminId],
    );
    return rows[0].id;
  }

  const statusOf = async (table: string, id: number): Promise<string> => {
    const rows = await dataSource.query(`SELECT status FROM ${table} WHERE id = $1`, [id]);
    return rows[0].status;
  };

  async function createSchedule(day_of_week: number): Promise<void> {
    await asAdmin(
      request(app.getHttpServer()).post(url('/admin/work-schedules')).send({
        employee_id: employeeId,
        day_of_week,
        expected_in: '09:00:00',
        expected_out: '18:00:00',
        break_minutes: 60,
        break_start: '12:00:00',
        effective_from: '2026-01-05',
      }),
    ).expect(201);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forFeature([PermissionEntity, RoleEntity, UserEntity, LeaveAllocationEntity]),
      ],
      providers: [PermissionSeedService, RoleSeedService, UserSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE leave_requests, time_correction_requests, work_schedules, time_entries, ' +
        'leave_allocations, approval_chains, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();

    const adminLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(ADMIN);
    adminToken = adminLogin.body.access_token;
    adminId = adminLogin.body.user.id;
    const empLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(EMPLOYEE);
    employeeToken = empLogin.body.access_token;
    employeeId = empLogin.body.user.id;

    await createSchedule(1);
    await createSchedule(2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('employee (no SCHEDULE:Update) cannot preview a change', async () => {
    await request(app.getHttpServer())
      .post(url('/admin/work-schedules/changes/preview'))
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ employee_id: employeeId, day_of_week: 1, effective_from: MON, mode: 'remove' })
      .expect(403);
  });

  it('a pure window change does NOT cancel a full-day future leave (precision)', async () => {
    await insertLeave({ start_date: TUE, end_date: TUE }); // full-day Tuesday
    const res = await asAdmin(
      request(app.getHttpServer()).post(url('/admin/work-schedules/changes/preview')).send({
        employee_id: employeeId,
        day_of_week: 2,
        effective_from: TUE,
        mode: 'modify',
        expected_in: '10:00:00',
        expected_out: '19:00:00',
        break_minutes: 60,
        break_start: '13:00:00',
      }),
    ).expect(201);
    expect(res.body.affected_leaves).toHaveLength(0);
    expect(res.body.versioning).toBe('end_and_create');
  });

  describe('removal cascade on Monday', () => {
    let futureLeaveId: number;
    let inProgressLeaveId: number;
    let correctionId: number;

    beforeAll(async () => {
      futureLeaveId = await insertLeave({ start_date: MON, end_date: MON }); // future, approved
      inProgressLeaveId = await insertLeave({ start_date: offsetToday(-3), end_date: MON }); // spans today
      correctionId = await insertCorrection(MON);
    });

    it('preview lists the future leave + correction, not the in-progress leave, and writes nothing', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules/changes/preview')).send({
          employee_id: employeeId,
          day_of_week: 1,
          effective_from: MON,
          mode: 'remove',
        }),
      ).expect(201);

      const leaveIds = res.body.affected_leaves.map((a: { id: number }) => a.id);
      expect(leaveIds).toContain(futureLeaveId);
      expect(leaveIds).not.toContain(inProgressLeaveId);
      expect(res.body.affected_corrections.map((a: { id: number }) => a.id)).toContain(
        correctionId,
      );
      expect(res.body.freed_leave_days).toBe(1);

      // preview is read-only — nothing changed
      expect(await statusOf('leave_requests', futureLeaveId)).toBe('approved');
    });

    it('apply cancels future requests, keeps the in-progress leave, and ends the schedule row', async () => {
      const preview = await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules/changes/preview')).send({
          employee_id: employeeId,
          day_of_week: 1,
          effective_from: MON,
          mode: 'remove',
        }),
      ).expect(201);

      const previewed = [...preview.body.affected_leaves, ...preview.body.affected_corrections].map(
        (a: { kind: string; id: number; status: string }) => ({
          kind: a.kind,
          id: a.id,
          status: a.status,
        }),
      );

      const res = await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules/changes')).send({
          employee_id: employeeId,
          day_of_week: 1,
          effective_from: MON,
          mode: 'remove',
          previewed,
        }),
      ).expect(200);
      expect(res.body.versioning).toBe('end_only');

      expect(await statusOf('leave_requests', futureLeaveId)).toBe('cancelled');
      expect(await statusOf('time_correction_requests', correctionId)).toBe('cancelled');
      expect(await statusOf('leave_requests', inProgressLeaveId)).toBe('approved');

      // the Monday schedule row is logically ended (no active row remains)
      const active = await dataSource.query(
        'SELECT id FROM work_schedules WHERE employee_id = $1 AND day_of_week = 1 AND effective_to IS NULL AND deleted_at IS NULL',
        [employeeId],
      );
      expect(active).toHaveLength(0);
    });
  });

  it('apply 409s when the affected set drifted since preview', async () => {
    await insertLeave({ start_date: TUE, end_date: TUE }); // L1 on Tuesday
    const preview = await asAdmin(
      request(app.getHttpServer()).post(url('/admin/work-schedules/changes/preview')).send({
        employee_id: employeeId,
        day_of_week: 2,
        effective_from: TUE,
        mode: 'remove',
      }),
    ).expect(201);
    const previewed = preview.body.affected_leaves.map(
      (a: { kind: string; id: number; status: string }) => ({
        kind: a.kind,
        id: a.id,
        status: a.status,
      }),
    );

    // a second affected leave appears AFTER the preview
    await insertLeave({ start_date: TUE, end_date: TUE });

    await asAdmin(
      request(app.getHttpServer()).post(url('/admin/work-schedules/changes')).send({
        employee_id: employeeId,
        day_of_week: 2,
        effective_from: TUE,
        mode: 'remove',
        previewed,
      }),
    ).expect(409);
  });
});
