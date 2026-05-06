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
import { PermissionEntity } from '../src/permissions/persistence/entities/permission.entity';
import { RoleEntity } from '../src/roles/persistence/entities/role.entity';

describe('Roles admin (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([PermissionEntity, RoleEntity])],
      providers: [PermissionSeedService, RoleSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE role_permissions, roles, permissions RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin/roles returns five seeded roles with their permission counts', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/roles`)
      .expect(200);

    expect(res.body.total).toBe(5);
    const byName = Object.fromEntries(
      res.body.data.map((r: { name: string; permissions: unknown[] }) => [
        r.name,
        r.permissions.length,
      ]),
    );
    expect(byName.SUPER_ADMIN).toBe(10);
    expect(byName.HR_ADMIN).toBe(6);
    expect(byName.PROJECT_MANAGER).toBe(0);
    expect(byName.TECHNICAL_DIRECTOR).toBe(0);
    expect(byName.EMPLOYEE).toBe(0);
  });

  it('GET /admin/roles/:id returns HR_ADMIN with its 6 permissions', async () => {
    const list = await request(app.getHttpServer()).get(`/api/v${API_VERSION}/admin/roles`);
    const hrAdmin = list.body.data.find((r: { name: string }) => r.name === 'HR_ADMIN');

    const res = await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/roles/${hrAdmin.id}`)
      .expect(200);

    expect(res.body.name).toBe('HR_ADMIN');
    expect(res.body.permissions).toHaveLength(6);
    const codes: string[] = res.body.permissions.map((p: { code: string }) => p.code);
    expect(codes).toContain('USER:Create');
    expect(codes).toContain('PERMISSION:View');
  });

  it('GET /admin/roles/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/roles/99999`)
      .expect(404);
  });
});
