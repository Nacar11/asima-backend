import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
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

describe('Roles admin (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
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
    await dataSource.query(
      'TRUNCATE TABLE role_permissions, users, roles, permissions RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();

    const login = await request(app.getHttpServer()).post(url('/auth/login')).send(ADMIN);
    adminToken = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);

  describe('Read endpoints', () => {
    it('GET /admin/roles returns the seeded roles with permission counts', async () => {
      const res = await auth(request(app.getHttpServer()).get(url('/admin/roles'))).expect(200);
      // SUPER_ADMIN, HR_ADMIN, OPERATIONS_MANAGER, PROJECT_MANAGER,
      // TECHNICAL_DIRECTOR, EMPLOYEE — see seeds/data/roles.json.
      expect(res.body.total).toBe(6);
      const byName = Object.fromEntries(
        res.body.data.map((r: { name: string; permissions: unknown[] }) => [
          r.name,
          r.permissions.length,
        ]),
      );
      // SUPER_ADMIN gets the wildcard — count is whatever permissions.json
      // currently contains. HR_ADMIN is the core admin operator (USER + ROLE/
      // PERMISSION read + TIME + SCHEDULE + LEAVE/TIME_CORRECTION/APPROVAL_CHAIN).
      // EMPLOYEE gets LEAVE:Create/ViewOwn + TIME_CORRECTION:Create/ViewOwn after Phase 0.
      expect(byName.SUPER_ADMIN).toBeGreaterThan(0);
      expect(byName.HR_ADMIN).toBeGreaterThanOrEqual(14);
      expect(byName.EMPLOYEE).toBeGreaterThanOrEqual(4);
    });

    it('GET /admin/roles/:id returns 404 for unknown id', async () => {
      await auth(request(app.getHttpServer()).get(url('/admin/roles/99999'))).expect(404);
    });
  });

  describe('Create / Update / Assign / Delete', () => {
    let supervisorId: number;
    let userViewPermId: number;

    beforeAll(async () => {
      // Filter to USER resource — the unfiltered catalog now exceeds the default
      // page size after Phase 0 added LEAVE / TIME_CORRECTION / APPROVAL_CHAIN.
      const perms = await auth(
        request(app.getHttpServer()).get(url('/admin/permissions?resource=USER')),
      );
      userViewPermId = perms.body.data.find((p: { code: string }) => p.code === 'USER:View').id;
    });

    it('POST /admin/roles creates a role with an initial permission set', async () => {
      const res = await auth(
        request(app.getHttpServer())
          .post(url('/admin/roles'))
          .send({
            name: 'SUPERVISOR',
            description: 'Field supervisor',
            permission_ids: [userViewPermId],
          }),
      ).expect(201);

      expect(res.body.name).toBe('SUPERVISOR');
      expect(res.body.permissions).toHaveLength(1);
      expect(res.body.permissions[0].code).toBe('USER:View');
      supervisorId = res.body.id;
    });

    it('POST /admin/roles rejects duplicate names with 409', async () => {
      await auth(
        request(app.getHttpServer())
          .post(url('/admin/roles'))
          .send({ name: 'SUPERVISOR', permission_ids: [] }),
      ).expect(409);
    });

    it('POST /admin/roles rejects unknown permission_ids with 422', async () => {
      await auth(
        request(app.getHttpServer())
          .post(url('/admin/roles'))
          .send({ name: 'TEMP_ROLE', permission_ids: [99999] }),
      ).expect(422);
    });

    it('PATCH /admin/roles/:id updates the description', async () => {
      const res = await auth(
        request(app.getHttpServer())
          .patch(url(`/admin/roles/${supervisorId}`))
          .send({ description: 'Updated description' }),
      ).expect(200);
      expect(res.body.description).toBe('Updated description');
    });

    it('POST /admin/roles/:id/permissions replaces the permission set', async () => {
      const res = await auth(
        request(app.getHttpServer())
          .post(url(`/admin/roles/${supervisorId}/permissions`))
          .send({ permission_ids: [] }),
      ).expect(201);
      expect(res.body.permissions).toHaveLength(0);
    });

    it('DELETE /admin/roles/:id soft-deletes non-protected roles', async () => {
      await auth(request(app.getHttpServer()).delete(url(`/admin/roles/${supervisorId}`))).expect(
        204,
      );
    });

    it('DELETE /admin/roles/:id refuses to delete built-in SUPER_ADMIN (403)', async () => {
      const list = await auth(request(app.getHttpServer()).get(url('/admin/roles')));
      const superAdmin = list.body.data.find((r: { name: string }) => r.name === 'SUPER_ADMIN');
      await auth(request(app.getHttpServer()).delete(url(`/admin/roles/${superAdmin.id}`))).expect(
        403,
      );
    });
  });
});
