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

describe('Approval Chains (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let employeeId: number;
  let l1Id: number; // karen_taylor (TD)
  let l2Id: number; // james_wilson (PM)
  let altId: number; // fred_bloggs (TD) — bulk-reassign target

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
      'TRUNCATE TABLE approval_chains, work_schedules, time_entries, role_permissions, users, roles, permissions ' +
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

    const idOf = async (email: string): Promise<number> => {
      const [row] = await dataSource.query('SELECT id FROM users WHERE email = $1', [email]);
      return row.id;
    };
    l1Id = await idOf('karen_taylor@asima.inc');
    l2Id = await idOf('james_wilson@asima.inc');
    altId = await idOf('fred_bloggs@asima.inc');
  });

  afterAll(async () => {
    await app.close();
  });

  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
  const asEmployee = (req: request.Test) => req.set('Authorization', `Bearer ${employeeToken}`);

  describe('Authorization', () => {
    it('rejects an EMPLOYEE (no APPROVAL_CHAIN:View) from the admin list with 403', async () => {
      await asEmployee(request(app.getHttpServer()).get(url('/admin/approvers'))).expect(403);
    });
  });

  describe('setChain (PATCH /admin/approvers/:employee_id)', () => {
    it('sets L1 + L2 and creates two active rows', async () => {
      const res = await asAdmin(
        request(app.getHttpServer())
          .patch(url(`/admin/approvers/${employeeId}`))
          .send({ l1_approver_id: l1Id, l2_approver_id: l2Id }),
      ).expect(200);

      expect(res.body).toEqual({ l1_approver_id: l1Id, l2_approver_id: l2Id });

      const rows = await dataSource.query(
        'SELECT step, approver_id FROM approval_chains WHERE employee_id = $1 AND ended_at IS NULL ORDER BY step',
        [employeeId],
      );
      expect(rows).toEqual([
        { step: 1, approver_id: l1Id },
        { step: 2, approver_id: l2Id },
      ]);
    });

    it('GET /admin/approvers/:employee_id returns the active chain', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).get(url(`/admin/approvers/${employeeId}`)),
      ).expect(200);

      expect(res.body.employee_id).toBe(employeeId);
      expect(res.body.l1.approver_id).toBe(l1Id);
      expect(res.body.l2.approver_id).toBe(l2Id);
    });

    it('reassigning L1 ends the old row and leaves exactly one active L1 row', async () => {
      await asAdmin(
        request(app.getHttpServer())
          .patch(url(`/admin/approvers/${employeeId}`))
          .send({ l1_approver_id: altId }),
      ).expect(200);

      const all = await dataSource.query(
        'SELECT approver_id, ended_at FROM approval_chains WHERE employee_id = $1 AND step = 1 ORDER BY id',
        [employeeId],
      );
      expect(all).toHaveLength(2); // old (ended) + new (active)
      const active = all.filter((r: { ended_at: Date | null }) => r.ended_at === null);
      expect(active).toHaveLength(1);
      expect(active[0].approver_id).toBe(altId);
    });

    it('rejects self-assignment with 422', async () => {
      const res = await asAdmin(
        request(app.getHttpServer())
          .patch(url(`/admin/approvers/${employeeId}`))
          .send({ l1_approver_id: employeeId }),
      ).expect(422);
      expect(res.body.errors.approver_id).toBeDefined();
    });

    it('rejects assigning L2 without an L1 (422)', async () => {
      const liam = (
        await dataSource.query('SELECT id FROM users WHERE email = $1', ['liam_garcia@asima.inc'])
      )[0].id;
      const res = await asAdmin(
        request(app.getHttpServer())
          .patch(url(`/admin/approvers/${liam}`))
          .send({ l2_approver_id: l2Id }),
      ).expect(422);
      expect(res.body.errors.l1_approver_id).toBeDefined();
    });
  });

  describe('bulk-reassign (POST /admin/approvers/bulk-reassign)', () => {
    it('moves every active assignment from one approver to another', async () => {
      // employee currently has altId as L1. Move altId -> l1Id.
      const res = await asAdmin(
        request(app.getHttpServer())
          .post(url('/admin/approvers/bulk-reassign'))
          .send({ from_approver_id: altId, to_approver_id: l1Id }),
      ).expect(200);

      expect(res.body.reassigned).toBeGreaterThanOrEqual(1);
      expect(res.body.skipped).toEqual([]);

      const active = await dataSource.query(
        'SELECT approver_id FROM approval_chains WHERE employee_id = $1 AND step = 1 AND ended_at IS NULL',
        [employeeId],
      );
      expect(active).toEqual([{ approver_id: l1Id }]);
    });
  });

  describe('list (GET /admin/approvers)', () => {
    it('returns the employee with resolved approver names', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).get(url('/admin/approvers?search=Emma')),
      ).expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      const emma = res.body.data.find((r: { employee_id: number }) => r.employee_id === employeeId);
      expect(emma).toBeDefined();
      expect(emma.l1_approver_id).toBe(l1Id);
      expect(emma.l1_approver_name).toBe('Karen Taylor');
      expect(emma.l2_approver_name).toBe('James Wilson');
    });

    it('unassigned=true returns only employees with no active L1', async () => {
      const all = await asAdmin(
        request(app.getHttpServer()).get(url('/admin/approvers?limit=100')),
      ).expect(200);
      const unassigned = await asAdmin(
        request(app.getHttpServer()).get(url('/admin/approvers?unassigned=true&limit=100')),
      ).expect(200);

      // Emma has an L1 at this point, so she is excluded from the filtered set.
      expect(
        unassigned.body.data.some((r: { employee_id: number }) => r.employee_id === employeeId),
      ).toBe(false);
      // Every returned row genuinely has no L1.
      for (const row of unassigned.body.data) {
        expect(row.l1_approver_id).toBeNull();
      }
      // The filter narrows the set.
      expect(unassigned.body.total).toBeLessThan(all.body.total);
      expect(unassigned.body.total).toBeGreaterThan(0);
    });
  });

  describe('list ids (GET /admin/approvers/ids)', () => {
    it('returns just the matching employee ids, honouring the unassigned filter', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).get(url('/admin/approvers/ids?unassigned=true')),
      ).expect(200);

      expect(Array.isArray(res.body.employee_ids)).toBe(true);
      expect(res.body.employee_ids.length).toBeGreaterThan(0);
      // Emma has an L1, so she must not appear in the unassigned id set.
      expect(res.body.employee_ids).not.toContain(employeeId);
    });
  });

  describe('endStep (DELETE /admin/approvers/:employee_id/:step)', () => {
    it('refuses to remove L1 while L2 is still assigned (422)', async () => {
      const res = await asAdmin(
        request(app.getHttpServer()).delete(url(`/admin/approvers/${employeeId}/1`)),
      ).expect(422);
      expect(res.body.errors.step).toBeDefined();
    });

    it('ends L2 then L1 successfully', async () => {
      await asAdmin(
        request(app.getHttpServer()).delete(url(`/admin/approvers/${employeeId}/2`)),
      ).expect(200);
      await asAdmin(
        request(app.getHttpServer()).delete(url(`/admin/approvers/${employeeId}/1`)),
      ).expect(200);

      const active = await dataSource.query(
        'SELECT step FROM approval_chains WHERE employee_id = $1 AND ended_at IS NULL',
        [employeeId],
      );
      expect(active).toEqual([]);
    });
  });
});
