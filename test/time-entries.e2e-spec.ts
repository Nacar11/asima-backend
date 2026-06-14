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

const ADMIN = { email: 'admin@asima.inc', password: 'Asima@1234' };
const EMPLOYEE = { email: 'emma_thompson@asima.inc', password: 'Asima@1234' };

describe('Time Entries (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let employeeToken: string;
  let adminToken: string;

  const url = (p: string) => `/api/v${API_VERSION}${p}`;

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
    // Reset the slice we care about. Work schedules and time entries are
    // cleared so the test doesn't conflict with dev-mode seed data.
    await dataSource.query(
      'TRUNCATE TABLE work_schedules, time_entries, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();

    const empLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(EMPLOYEE);
    employeeToken = empLogin.body.access_token;
    const adminLogin = await request(app.getHttpServer()).post(url('/auth/login')).send(ADMIN);
    adminToken = adminLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const asEmployee = (req: request.Test) => req.set('Authorization', `Bearer ${employeeToken}`);
  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);

  describe('Self-service toggle-punch', () => {
    let openEntryId: number;

    it('POST /users/me/time-entries/punch opens a new entry when none is open', async () => {
      const res = await asEmployee(
        request(app.getHttpServer()).post(url('/users/me/time-entries/punch')),
      ).expect(201);

      expect(res.body.status).toBe('open');
      expect(res.body.time_out).toBeNull();
      expect(res.body.source).toBe('manual');
      openEntryId = res.body.id;
    });

    it('punching again within 5 minutes is rejected by the cooldown (429)', async () => {
      const res = await asEmployee(
        request(app.getHttpServer()).post(url('/users/me/time-entries/punch')),
      ).expect(429);

      expect(res.body.retry_after_seconds).toBeGreaterThan(0);
    });

    it('after the cooldown elapses, punch closes the open entry', async () => {
      // Backdate the open entry's time_in past the cooldown window so the next
      // punch is allowed — `findLatestForEmployee` keys an open row on time_in.
      const sixMinAgo = new Date(Date.now() - 6 * 60_000);
      await dataSource.query('UPDATE time_entries SET time_in = $1 WHERE id = $2', [
        sixMinAgo,
        openEntryId,
      ]);

      const res = await asEmployee(
        request(app.getHttpServer()).post(url('/users/me/time-entries/punch')),
      ).expect(201);

      expect(res.body.id).toBe(openEntryId);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.time_out).not.toBeNull();
    });

    it('GET /users/me/time-entries shows the closed segment', async () => {
      const res = await asEmployee(
        request(app.getHttpServer()).get(url('/users/me/time-entries')),
      ).expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      const mine = res.body.data.filter((e: { status: string }) => e.status === 'confirmed');
      expect(mine.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /users/me/time-entries/today returns the row(s) for today', async () => {
      const res = await asEmployee(
        request(app.getHttpServer()).get(url('/users/me/time-entries/today')),
      ).expect(200);

      const today = new Date().toISOString().slice(0, 10);
      res.body.data.forEach((e: { work_date: string }) => expect(e.work_date).toBe(today));
    });
  });

  describe('PermissionsGuard on /admin/time-entries', () => {
    it('employee → 403', async () => {
      await asEmployee(request(app.getHttpServer()).get(url('/admin/time-entries'))).expect(403);
    });

    it('admin → 200', async () => {
      await asAdmin(request(app.getHttpServer()).get(url('/admin/time-entries'))).expect(200);
    });
  });
});
