import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
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
import { TypeOrmModule } from '@nestjs/typeorm';

const ADMIN = { email: 'admin@asima.inc', password: 'Asima@1234' };

describe('Permissions admin (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  const url = (p: string) => `/api/v${API_VERSION}${p}`;

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
    await dataSource.query(
      'TRUNCATE TABLE work_schedules, time_entries, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
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

  it(`GET /api/v${API_VERSION}/admin/permissions returns the seeded codes`, async () => {
    const res = await auth(request(app.getHttpServer()).get(url('/admin/permissions'))).expect(200);

    // The catalog grows as new modules add codes — assert lower bound and
    // presence of representative codes from each resource family.
    expect(res.body.total).toBeGreaterThanOrEqual(10);
    const codes = res.body.data.map((p: { code: string }) => p.code).sort();
    expect(codes).toContain('USER:Create');
    expect(codes).toContain('PERMISSION:Update');
    expect(codes).toContain('TIME:View');
    expect(codes).toContain('SCHEDULE:View');
  });

  it('filters by resource', async () => {
    const res = await auth(
      request(app.getHttpServer()).get(url('/admin/permissions?resource=USER')),
    ).expect(200);

    expect(res.body.total).toBe(4);
    res.body.data.forEach((p: { resource: string }) => expect(p.resource).toBe('USER'));
  });

  it('rejects unknown query fields with 422', async () => {
    await auth(request(app.getHttpServer()).get(url('/admin/permissions?evil=1'))).expect(422);
  });
});
