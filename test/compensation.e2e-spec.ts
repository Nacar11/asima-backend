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
import { CompensationService } from '../src/compensation/compensation.service';
import { deriveHourlyRate } from '../src/compensation/compensation.constants';

const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';
const ADMIN = { email: 'admin@asima.inc', password: SEED_PASSWORD };
const EMPLOYEE = { email: 'emma_thompson@asima.inc', password: SEED_PASSWORD };

// Fixed past dates — always <= today (so the no-future-dating guard accepts
// them) and strictly ordered so each acts as a real pay change.
const FROM_1 = '2020-01-01';
const FROM_2 = '2020-06-01';
const END_1 = '2020-05-31'; // dayBefore(FROM_2)
const FROM_3 = '2020-12-01';

describe('Compensation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let compService: CompensationService;
  let adminToken: string;
  let employeeToken: string;
  let employeeId: number;
  let firstRowId: number;
  let secondRowId: number;

  const url = (p: string) => `/api/v${API_VERSION}${p}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

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
    compService = moduleFixture.get(CompensationService);
    await dataSource.query(
      'TRUNCATE TABLE employee_compensations, work_schedules, time_entries, role_permissions, ' +
        'users, roles, permissions RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();

    const adminLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(ADMIN);
    adminToken = adminLogin.body.access_token;
    const empLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(EMPLOYEE);
    employeeToken = empLogin.body.access_token;
    employeeId = empLogin.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 + empty body for an employee with no compensation yet', async () => {
    const res = await request(app.getHttpServer())
      .get(url('/users/me/compensation'))
      .set(auth(employeeToken));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toHaveLength(0); // null over HTTP = empty body
  });

  it('admin sets compensation and derives the hourly rate', async () => {
    const res = await request(app.getHttpServer())
      .post(url('/admin/compensation'))
      .set(auth(adminToken))
      .send({ employee_id: employeeId, monthly_salary: 50000, effective_from: FROM_1 });
    expect(res.status).toBe(201);
    expect(res.body.monthly_salary).toBe(50000);
    expect(res.body.hourly_rate).toBeCloseTo(deriveHourlyRate(50000), 4);
    expect(res.body.hourly_rate_is_overridden).toBe(false);
    firstRowId = res.body.id;
  });

  it('lets the employee read their own compensation', async () => {
    const res = await request(app.getHttpServer())
      .get(url('/users/me/compensation'))
      .set(auth(employeeToken));
    expect(res.status).toBe(200);
    expect(res.body.monthly_salary).toBe(50000);
  });

  it('forbids an employee from setting compensation (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(url('/admin/compensation'))
      .set(auth(employeeToken))
      .send({ employee_id: employeeId, monthly_salary: 1, effective_from: FROM_1 });
    expect(res.status).toBe(403);
  });

  it('rejects a future-dated effective_from (422)', async () => {
    const res = await request(app.getHttpServer())
      .post(url('/admin/compensation'))
      .set(auth(adminToken))
      .send({ employee_id: employeeId, monthly_salary: 9, effective_from: '2999-12-31' });
    expect(res.status).toBe(422);
  });

  it('changes pay: ends the prior row and keeps exactly one active row', async () => {
    const res = await request(app.getHttpServer())
      .post(url('/admin/compensation'))
      .set(auth(adminToken))
      .send({ employee_id: employeeId, monthly_salary: 60000, effective_from: FROM_2 });
    expect(res.status).toBe(201);
    secondRowId = res.body.id;

    const history = await request(app.getHttpServer())
      .get(url(`/admin/compensation/employees/${employeeId}`))
      .set(auth(adminToken));
    expect(history.body).toHaveLength(2);
    // newest first
    expect(history.body[0].effective_from).toBe(FROM_2);
    expect(history.body[0].effective_to).toBeNull();
    expect(history.body[1].effective_from).toBe(FROM_1);
    expect(history.body[1].effective_to).toBe(END_1);
  });

  it('findRateOnDate resolves the correct row on boundary dates', async () => {
    const onFrom = await compService.findRateOnDate(employeeId, FROM_2);
    expect(onFrom?.monthly_salary).toBe(60000);
    const onTo = await compService.findRateOnDate(employeeId, END_1);
    expect(onTo?.monthly_salary).toBe(50000);
    const mid = await compService.findRateOnDate(employeeId, '2020-03-01');
    expect(mid?.monthly_salary).toBe(50000);
    const before = await compService.findRateOnDate(employeeId, '2019-01-01');
    expect(before).toBeNull();
  });

  it('corrects the active row in place (PATCH) without adding history', async () => {
    const res = await request(app.getHttpServer())
      .patch(url(`/admin/compensation/${secondRowId}`))
      .set(auth(adminToken))
      .send({ monthly_salary: 65000 });
    expect(res.status).toBe(200);
    expect(res.body.monthly_salary).toBe(65000);
    expect(res.body.hourly_rate).toBeCloseTo(deriveHourlyRate(65000), 4);

    const history = await request(app.getHttpServer())
      .get(url(`/admin/compensation/employees/${employeeId}`))
      .set(auth(adminToken));
    expect(history.body).toHaveLength(2); // still 2 — no new row
  });

  it('deletes the active row (204) and reactivates the prior row', async () => {
    const res = await request(app.getHttpServer())
      .delete(url(`/admin/compensation/${secondRowId}`))
      .set(auth(adminToken));
    expect(res.status).toBe(204);

    // The previously-ended row is active again.
    const me = await request(app.getHttpServer())
      .get(url('/users/me/compensation'))
      .set(auth(employeeToken));
    expect(me.body.id).toBe(firstRowId);
    expect(me.body.effective_to).toBeNull();
    expect(me.body.monthly_salary).toBe(50000);
  });

  it('rejects deleting a non-active (historical) row (409)', async () => {
    // firstRowId is active again; create a newer row so firstRowId becomes historical.
    await request(app.getHttpServer())
      .post(url('/admin/compensation'))
      .set(auth(adminToken))
      .send({ employee_id: employeeId, monthly_salary: 70000, effective_from: FROM_3 });

    const res = await request(app.getHttpServer())
      .delete(url(`/admin/compensation/${firstRowId}`))
      .set(auth(adminToken));
    expect(res.status).toBe(409);
  });

  // --- Phase 4 additions: currency, bulk, audit trail -----------------------

  describe('Phase 4', () => {
    let liamId: number;
    let oliviaId: number;
    let noahId: number;
    let liamRowId: number;

    beforeAll(async () => {
      const ids = (await dataSource.query(
        `SELECT id, email FROM users WHERE email IN ($1, $2, $3)`,
        ['liam_garcia@asima.inc', 'olivia_martinez@asima.inc', 'noah_rodriguez@asima.inc'],
      )) as { id: number; email: string }[];
      const byEmail = new Map(ids.map((r) => [r.email, r.id]));
      liamId = byEmail.get('liam_garcia@asima.inc')!;
      oliviaId = byEmail.get('olivia_martinez@asima.inc')!;
      noahId = byEmail.get('noah_rodriguez@asima.inc')!;
    });

    it('surfaces currency on read payloads (/me and admin detail)', async () => {
      const me = await request(app.getHttpServer())
        .get(url('/users/me/compensation'))
        .set(auth(employeeToken));
      expect(me.body.currency).toBe('PHP');

      const detail = await request(app.getHttpServer())
        .get(url(`/admin/compensation/${firstRowId}`))
        .set(auth(adminToken));
      expect(detail.body.currency).toBe('PHP');
    });

    it('bulk-sets pay for several employees in one transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/admin/compensation/bulk'))
        .set(auth(adminToken))
        .send({
          items: [
            { employee_id: liamId, monthly_salary: 50000, effective_from: FROM_2 },
            { employee_id: oliviaId, monthly_salary: 55000, effective_from: FROM_2 },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].currency).toBe('PHP');
      liamRowId = res.body.find((r: { employee_id: number }) => r.employee_id === liamId).id;
    });

    it('rejects a bulk payload with a duplicate employee_id (422)', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/admin/compensation/bulk'))
        .set(auth(adminToken))
        .send({
          items: [
            { employee_id: noahId, monthly_salary: 40000, effective_from: FROM_3 },
            { employee_id: noahId, monthly_salary: 41000, effective_from: FROM_3 },
          ],
        });
      expect(res.status).toBe(422);
    });

    it('rolls back the whole batch when one item fails mid-transaction', async () => {
      // liam already has an active row at FROM_2; FROM_1 is before it → that item
      // throws inside the transaction, so noah's valid item must NOT persist.
      const res = await request(app.getHttpServer())
        .post(url('/admin/compensation/bulk'))
        .set(auth(adminToken))
        .send({
          items: [
            { employee_id: liamId, monthly_salary: 99000, effective_from: FROM_1 },
            { employee_id: noahId, monthly_salary: 40000, effective_from: FROM_2 },
          ],
        });
      expect(res.status).toBe(422);

      const noahHistory = await request(app.getHttpServer())
        .get(url(`/admin/compensation/employees/${noahId}`))
        .set(auth(adminToken));
      expect(noahHistory.body).toHaveLength(0); // rolled back
    });

    it('records an audit trail (created, then updated) for a corrected row', async () => {
      await request(app.getHttpServer())
        .patch(url(`/admin/compensation/${liamRowId}`))
        .set(auth(adminToken))
        .send({ monthly_salary: 52000 });

      const res = await request(app.getHttpServer())
        .get(url(`/admin/compensation/${liamRowId}/audit`))
        .set(auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // newest first: the correction, then the creation
      expect(res.body[0].action).toBe('updated');
      expect(res.body[0].before_monthly_salary).toBe(50000);
      expect(res.body[0].after_monthly_salary).toBe(52000);
      expect(res.body[1].action).toBe('created');
      expect(res.body[1].after_monthly_salary).toBe(50000);
    });

    it('forbids a non-HR employee from reading an audit trail (403)', async () => {
      const res = await request(app.getHttpServer())
        .get(url(`/admin/compensation/${liamRowId}/audit`))
        .set(auth(employeeToken));
      expect(res.status).toBe(403);
    });
  });
});
