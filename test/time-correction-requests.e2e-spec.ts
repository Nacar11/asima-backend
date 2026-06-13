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
const cred = (email: string) => ({ email, password: SEED_PASSWORD });

describe('Time Correction Requests (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const tokens: Record<string, string> = {};
  const ids: Record<string, number> = {};

  const url = (p: string) => `/api/v${API_VERSION}${p}`;
  const auth = (token: string) => (req: request.Test) =>
    req.set('Authorization', `Bearer ${token}`);

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
      'TRUNCATE TABLE time_correction_requests, leave_requests, approval_chains, work_schedules, time_entries, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();
    await app.init();

    const people: Record<string, string> = {
      admin: 'admin@asima.inc',
      hr: 'jane_smith@asima.inc',
      emma: 'emma_thompson@asima.inc',
      liam: 'liam_garcia@asima.inc',
      karen: 'karen_taylor@asima.inc',
      james: 'james_wilson@asima.inc',
    };
    for (const [key, email] of Object.entries(people)) {
      const res = await request(app.getHttpServer()).post(url('/auth/login')).send(cred(email));
      tokens[key] = res.body.access_token;
      ids[key] = res.body.user.id;
    }

    await auth(tokens.admin)(
      request(app.getHttpServer())
        .patch(url(`/admin/approvers/${ids.emma}`))
        .send({ l1_approver_id: ids.karen, l2_approver_id: ids.james }),
    ).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('hard-blocks submission when the employee has no chain (422)', async () => {
    const res = await auth(tokens.liam)(
      request(app.getHttpServer()).post(url('/users/me/time-correction-requests')).send({
        work_date: '2026-06-10',
        proposed_time_in: '2026-06-10T09:00:00.000Z',
        proposed_time_out: '2026-06-10T18:00:00.000Z',
        reason: 'Forgot to clock in',
      }),
    ).expect(422);
    expect(res.body.errors.approval_chain).toBeDefined();
  });

  describe('correcting an existing entry', () => {
    let entryId: number;
    let reqId: number;

    it('admin creates a time entry to be corrected', async () => {
      const res = await auth(tokens.admin)(
        request(app.getHttpServer()).post(url('/admin/time-entries')).send({
          employee_id: ids.emma,
          work_date: '2026-06-10',
          time_in: '2026-06-10T10:00:00.000Z',
          time_out: '2026-06-10T17:00:00.000Z',
          source: 'admin',
        }),
      ).expect(201);
      entryId = res.body.id;
    });

    it('employee submits a correction targeting that entry', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/time-correction-requests')).send({
          target_entry_id: entryId,
          work_date: '2026-06-10',
          proposed_time_in: '2026-06-10T09:00:00.000Z',
          proposed_time_out: '2026-06-10T18:00:00.000Z',
          reason: 'Clocked in late by mistake',
        }),
      ).expect(201);
      expect(res.body.status).toBe('pending_l1');
      expect(res.body.l1_approver_id).toBe(ids.karen);
      reqId = res.body.id;
    });

    it('rejects a duplicate correction for the same work_date (422)', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/time-correction-requests')).send({
          work_date: '2026-06-10',
          proposed_time_in: '2026-06-10T08:00:00.000Z',
          reason: 'Another correction',
        }),
      ).expect(422);
      expect(res.body.errors.work_date).toBeDefined();
    });

    it('L1 approves → pending_l2 (timesheet not yet touched)', async () => {
      const res = await auth(tokens.karen)(
        request(app.getHttpServer()).post(url(`/time-correction-requests/${reqId}/approve`)),
      ).expect(200);
      expect(res.body.status).toBe('pending_l2');

      const [row] = await dataSource.query('SELECT source FROM time_entries WHERE id = $1', [
        entryId,
      ]);
      expect(row.source).toBe('admin'); // unchanged until final approval
    });

    it('L2 approves → approved AND the time entry is rewritten with source=correction', async () => {
      const res = await auth(tokens.james)(
        request(app.getHttpServer()).post(url(`/time-correction-requests/${reqId}/approve`)),
      ).expect(200);
      expect(res.body.status).toBe('approved');

      const [row] = await dataSource.query(
        'SELECT source, time_in, time_out FROM time_entries WHERE id = $1',
        [entryId],
      );
      expect(row.source).toBe('correction');
      expect(new Date(row.time_in).toISOString()).toBe('2026-06-10T09:00:00.000Z');
      expect(new Date(row.time_out).toISOString()).toBe('2026-06-10T18:00:00.000Z');
    });
  });

  describe('missed-punch (no target entry)', () => {
    it('creates a brand-new correction time entry on approval', async () => {
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/time-correction-requests')).send({
          work_date: '2026-06-11',
          proposed_time_in: '2026-06-11T09:00:00.000Z',
          proposed_time_out: '2026-06-11T18:00:00.000Z',
          reason: 'Missed the punch entirely',
        }),
      ).expect(201);

      // HR override → straight to approved, which creates the entry.
      await auth(tokens.hr)(
        request(app.getHttpServer()).post(
          url(`/time-correction-requests/${submit.body.id}/approve`),
        ),
      ).expect(200);

      const rows = await dataSource.query(
        "SELECT source FROM time_entries WHERE employee_id = $1 AND work_date = '2026-06-11'",
        [ids.emma],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].source).toBe('correction');
    });
  });

  describe('inbox + authorization', () => {
    it('a correction appears in the approver inbox with kind=time_correction', async () => {
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/time-correction-requests')).send({
          work_date: '2026-06-12',
          proposed_time_in: '2026-06-12T09:00:00.000Z',
          // Manual-add (null target) requires a time_out since the guard in
          // TimeCorrectionRequestsService.submit landed — a brand-new log
          // can't be left open. See "missed-punch" test above.
          proposed_time_out: '2026-06-12T18:00:00.000Z',
          reason: 'Manual log for a missed day',
        }),
      ).expect(201);

      const res = await auth(tokens.karen)(
        request(app.getHttpServer()).get(url('/approvals/pending?type=time_correction')),
      ).expect(200);
      const item = res.body.data.find((r: { id: number }) => r.id === submit.body.id);
      expect(item).toBeDefined();
      expect(item.kind).toBe('time_correction');
    });

    it('an EMPLOYEE cannot list the admin correction view (403)', async () => {
      await auth(tokens.emma)(
        request(app.getHttpServer()).get(url('/admin/time-correction-requests')),
      ).expect(403);
    });

    it('HR admin list rows carry the joined employee_name', async () => {
      const res = await auth(tokens.hr)(
        request(app.getHttpServer()).get(url('/admin/time-correction-requests')),
      ).expect(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data[0].employee_name).toBe('string');
      expect(res.body.data[0].employee_name.length).toBeGreaterThan(0);
    });
  });
});
