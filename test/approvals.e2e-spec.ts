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

// Match the seed default-password fallback so the test works regardless of
// what a local .env sets SEED_DEFAULT_PASSWORD to (see UserSeedService).
const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';

const SUPER_ADMIN = { email: 'admin@asima.inc', password: SEED_PASSWORD };
const HR_ADMIN = { email: 'jane_smith@asima.inc', password: SEED_PASSWORD };
const PROJECT_MANAGER = { email: 'james_wilson@asima.inc', password: SEED_PASSWORD };
const TECHNICAL_DIRECTOR = { email: 'karen_taylor@asima.inc', password: SEED_PASSWORD };
const OPERATIONS_MANAGER = { email: 'mary_brown@asima.inc', password: SEED_PASSWORD };
const EMPLOYEE = { email: 'emma_thompson@asima.inc', password: SEED_PASSWORD };

describe('Approvals (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const tokens: Record<string, string> = {};
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
      'TRUNCATE TABLE role_permissions, users, roles, permissions RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();

    const login = async (key: string, creds: { email: string; password: string }) => {
      const res = await request(app.getHttpServer()).post(url('/auth/login')).send(creds);
      if (!res.body.access_token) {
        throw new Error(
          `login failed for ${key} (${creds.email}): status=${res.status} body=${JSON.stringify(res.body)}`,
        );
      }
      tokens[key] = res.body.access_token;
    };
    await login('superAdmin', SUPER_ADMIN);
    await login('hrAdmin', HR_ADMIN);
    await login('pm', PROJECT_MANAGER);
    await login('td', TECHNICAL_DIRECTOR);
    await login('om', OPERATIONS_MANAGER);
    await login('employee', EMPLOYEE);
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(url(path));
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('GET /approvals/pending', () => {
    it('returns 401 when unauthenticated', async () => {
      await get('/approvals/pending').expect(401);
    });

    it('returns 403 for EMPLOYEE (no APPROVAL:View)', async () => {
      await get('/approvals/pending', tokens.employee).expect(403);
    });

    it('returns 200 + empty paginated payload for PROJECT_MANAGER', async () => {
      const res = await get('/approvals/pending', tokens.pm).expect(200);
      expect(res.body).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        has_more: false,
      });
    });

    it('returns 200 + empty paginated payload for TECHNICAL_DIRECTOR', async () => {
      const res = await get('/approvals/pending', tokens.td).expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns 200 + empty paginated payload for OPERATIONS_MANAGER', async () => {
      const res = await get('/approvals/pending', tokens.om).expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns 200 for HR_ADMIN (canSeeAll override branch)', async () => {
      const res = await get('/approvals/pending', tokens.hrAdmin).expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns 200 for SUPER_ADMIN (system_admin bypass)', async () => {
      const res = await get('/approvals/pending', tokens.superAdmin).expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('echoes pagination query params back in the response', async () => {
      const res = await get('/approvals/pending?page=2&limit=5', tokens.pm).expect(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(5);
    });

    it('rejects non-integer page with 422', async () => {
      await get('/approvals/pending?page=abc', tokens.pm).expect(422);
    });
  });
});
