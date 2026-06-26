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

// The wire contract — must stay byte-identical to the pre-DDD response.
const EXPECTED_KEYS = [
  'id',
  'employee_id',
  'leave_type',
  'amount',
  'source',
  'reason',
  'granted_by',
  'created_by',
  'updated_by',
  'deleted_by',
  'created_at',
  'updated_at',
  'deleted_at',
];

describe('Leave Allocations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let employeeId: number;

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
    await dataSource.query(
      'TRUNCATE TABLE leave_allocations, work_schedules, time_entries, role_permissions, ' +
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

  it('admin grants leave days (201) with the byte-identical wire shape', async () => {
    const res = await request(app.getHttpServer())
      .post(url(`/admin/users/${employeeId}/leave-allocations`))
      .set(auth(adminToken))
      .send({ leave_type: 'vacation', amount: 5, reason: 'tenure bonus' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      employee_id: employeeId,
      leave_type: 'vacation',
      amount: 5,
      source: 'admin_grant',
      reason: 'tenure bonus',
    });
    expect(res.body.granted_by).toBeGreaterThan(0); // stamped with the acting admin's id
    expect(Object.keys(res.body).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("reads the employee's grant history newest-first (2 seeded defaults + the admin grant)", async () => {
    const res = await request(app.getHttpServer())
      .get(url(`/admin/users/${employeeId}/leave-allocations`))
      .set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // 10 vacation + 10 sick defaults, then the grant
    expect(res.body[0].source).toBe('admin_grant'); // newest first
    expect(res.body[0].amount).toBe(5);
  });

  it('rejects a non-positive amount with 422 (the DTO @Min(1) fires first; this app maps validation errors to 422)', async () => {
    // Over HTTP the ValidationPipe rejects amount=0 before the controller, with
    // the per-field 422 envelope (validation-options errorHttpStatusCode). The
    // domain guard yields the same 422 and is unit-tested directly (S5).
    const res = await request(app.getHttpServer())
      .post(url(`/admin/users/${employeeId}/leave-allocations`))
      .set(auth(adminToken))
      .send({ leave_type: 'vacation', amount: 0 });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('amount');
  });

  it('forbids a non-admin employee from granting (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(url(`/admin/users/${employeeId}/leave-allocations`))
      .set(auth(employeeToken))
      .send({ leave_type: 'vacation', amount: 1 });

    expect(res.status).toBe(403);
  });
});
