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

describe('Work Schedules (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let employeeId: number;

  const url = (p: string) => `/api/v${API_VERSION}${p}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([PermissionEntity, RoleEntity, UserEntity, LeaveAllocationEntity])],
      providers: [PermissionSeedService, RoleSeedService, UserSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE work_schedules, time_entries, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
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

  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
  const asEmployee = (req: request.Test) => req.set('Authorization', `Bearer ${employeeToken}`);

  describe('Admin CRUD', () => {
    let scheduleId: number;

    it('POST /admin/work-schedules creates a Monday schedule', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules')).send({
          employee_id: employeeId,
          day_of_week: 1,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: 60,
          break_start: '12:00:00',
          effective_from: '2026-05-23',
        }),
      ).expect(201);

      expect(res.body.day_of_week).toBe(1);
      expect(res.body.effective_to).toBeNull();
      expect(res.body.break_start).toBe('12:00:00');
      scheduleId = res.body.id;
    });

    it('rejects break_minutes > 0 without break_start (422)', async () => {
      await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules')).send({
          employee_id: employeeId,
          day_of_week: 3,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: 60,
          effective_from: '2026-05-23',
        }),
      ).expect(422);
    });

    it('refuses a second active row for the same (employee, Monday) with 409', async () => {
      await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules')).send({
          employee_id: employeeId,
          day_of_week: 1,
          expected_in: '08:00:00',
          expected_out: '17:00:00',
          break_minutes: 30,
          break_start: '12:00:00',
          effective_from: '2026-06-01',
        }),
      ).expect(409);
    });

    it('rejects bad windows with 422', async () => {
      await asAdmin(
        request(app.getHttpServer()).post(url('/admin/work-schedules')).send({
          employee_id: employeeId,
          day_of_week: 2,
          expected_in: '18:00:00',
          expected_out: '09:00:00',
          break_minutes: 60,
          effective_from: '2026-05-23',
        }),
      ).expect(422);
    });

    it('GET /users/me/work-schedule reflects the active row', async () => {
      const res = await asEmployee(
        request(app.getHttpServer()).get(url('/users/me/work-schedule')),
      ).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      const monday = res.body.find((s: { day_of_week: number }) => s.day_of_week === 1);
      expect(monday).toBeDefined();
      expect(monday.expected_in).toBe('09:00:00');
      expect(monday.break_start).toBe('12:00:00');
    });

    it('PATCH /admin/work-schedules/:id updates the break', async () => {
      const res = await asAdmin(
        request(app.getHttpServer())
          .patch(url(`/admin/work-schedules/${scheduleId}`))
          .send({ break_minutes: 30 }),
      ).expect(200);
      expect(res.body.break_minutes).toBe(30);
    });

    it('DELETE /admin/work-schedules/:id logically ends the row (sets effective_to)', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).delete(url(`/admin/work-schedules/${scheduleId}`)),
      ).expect(200);
      expect(res.body.effective_to).not.toBeNull();
    });

    it('refuses to logically end an already-ended row with 409', async () => {
      await asAdmin(
        request(app.getHttpServer()).delete(url(`/admin/work-schedules/${scheduleId}`)),
      ).expect(409);
    });
  });

  describe('PermissionsGuard', () => {
    it('employee gets 403 on /admin/work-schedules', async () => {
      await asEmployee(request(app.getHttpServer()).get(url('/admin/work-schedules'))).expect(403);
    });

    it('employee can read /users/me/work-schedule', async () => {
      await asEmployee(request(app.getHttpServer()).get(url('/users/me/work-schedule'))).expect(
        200,
      );
    });
  });
});
