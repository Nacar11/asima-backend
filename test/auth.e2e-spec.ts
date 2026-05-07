import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_VERSION } from '../src/utils/constants/api.constants';
import validationOptions from '../src/utils/validation-options';
import { PermissionEntity } from '../src/permissions/persistence/entities/permission.entity';
import { RoleEntity } from '../src/roles/persistence/entities/role.entity';
import { UserEntity } from '../src/users/persistence/entities/user.entity';
import { PermissionSeedService } from '../src/database/seeds/permission/permission-seed.service';
import { RoleSeedService } from '../src/database/seeds/role/role-seed.service';
import { UserSeedService } from '../src/database/seeds/user/user-seed.service';

const ADMIN = { email: 'admin@asima.inc', password: 'Asima@1234' };
const EMPLOYEE = { email: 'emma_thompson@asima.inc', password: 'Asima@1234' };

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([PermissionEntity, RoleEntity, UserEntity])],
      providers: [PermissionSeedService, RoleSeedService, UserSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    // Reset to a known state. Order matters: junction → roles/users → permissions.
    await dataSource.query(
      'TRUNCATE TABLE role_permissions, users, roles, permissions RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const url = (p: string) => `/api/v${API_VERSION}${p}`;

  describe('POST /auth/login', () => {
    it('returns tokens + user on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);

      expect(res.body.access_token).toEqual(expect.any(String));
      expect(res.body.refresh_token).toEqual(expect.any(String));
      expect(res.body.token_expires_in).toBeGreaterThan(0);
      expect(res.body.user.email).toBe(ADMIN.email);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('rejects wrong password with 401', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email: ADMIN.email, password: 'wrong-pw' })
        .expect(401);
    });

    it('rejects unknown email with 401', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email: 'nobody@asima.inc', password: 'Asima@1234' })
        .expect(401);
    });

    it('rejects malformed email with 422', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email: 'not-an-email', password: 'Asima@1234' })
        .expect(422);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the authenticated user with role + permissions', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);
      const access = login.body.access_token;

      const me = await request(app.getHttpServer())
        .get(url('/auth/me'))
        .set('Authorization', `Bearer ${access}`)
        .expect(200);

      expect(me.body.email).toBe(ADMIN.email);
      expect(me.body.role).toBeDefined();
      expect(Array.isArray(me.body.role.permissions)).toBe(true);
    });

    it('rejects requests without a token with 401', async () => {
      await request(app.getHttpServer()).get(url('/auth/me')).expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates tokens — new pair is different from the previous', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);
      const refreshToken = login.body.refresh_token;
      const oldAccess = login.body.access_token;

      // Wait 1.1s so iat differs (JWT exp/iat are second-precision).
      await new Promise((r) => setTimeout(r, 1100));

      const refreshed = await request(app.getHttpServer())
        .post(url('/auth/refresh'))
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(refreshed.body.access_token).toEqual(expect.any(String));
      expect(refreshed.body.refresh_token).toEqual(expect.any(String));
      expect(refreshed.body.access_token).not.toBe(oldAccess);
      expect(refreshed.body.refresh_token).not.toBe(refreshToken);
    });

    it('rejects an access token sent to /auth/refresh with 401 (wrong secret)', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);
      const access = login.body.access_token;

      await request(app.getHttpServer())
        .post(url('/auth/refresh'))
        .set('Authorization', `Bearer ${access}`)
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 (stateless)', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);

      await request(app.getHttpServer())
        .post(url('/auth/logout'))
        .set('Authorization', `Bearer ${login.body.access_token}`)
        .expect(204);
    });
  });

  describe('PermissionsGuard', () => {
    it('SUPER_ADMIN can hit /admin/users (system_admin bypass)', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(ADMIN)
        .expect(200);

      await request(app.getHttpServer())
        .get(url('/admin/users'))
        .set('Authorization', `Bearer ${login.body.access_token}`)
        .expect(200);
    });

    it('EMPLOYEE gets 403 on /admin/users', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(EMPLOYEE)
        .expect(200);

      await request(app.getHttpServer())
        .get(url('/admin/users'))
        .set('Authorization', `Bearer ${login.body.access_token}`)
        .expect(403);
    });

    it('EMPLOYEE can still hit /users/me (identity-only gate)', async () => {
      const login = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send(EMPLOYEE)
        .expect(200);

      const me = await request(app.getHttpServer())
        .get(url('/users/me'))
        .set('Authorization', `Bearer ${login.body.access_token}`)
        .expect(200);

      expect(me.body.email).toBe(EMPLOYEE.email);
    });
  });
});
