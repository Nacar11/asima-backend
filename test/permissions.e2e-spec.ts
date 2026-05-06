import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_VERSION } from '../src/utils/constants/api.constants';
import validationOptions from '../src/utils/validation-options';
import { PermissionSeedService } from '../src/database/seeds/permission/permission-seed.service';
import { PermissionEntity } from '../src/permissions/persistence/entities/permission.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Permissions admin (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([PermissionEntity])],
      providers: [PermissionSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    // Reset the table so the seed runs from a known state in this test.
    await dataSource.query('TRUNCATE TABLE permissions RESTART IDENTITY CASCADE');
    await moduleFixture.get(PermissionSeedService).run();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /api/v${API_VERSION}/admin/permissions returns the seeded codes`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/permissions`)
      .expect(200);

    expect(res.body.total).toBe(10);
    expect(res.body.data).toHaveLength(10);
    const codes = res.body.data.map((p: { code: string }) => p.code).sort();
    expect(codes).toContain('USER:Create');
    expect(codes).toContain('PERMISSION:Update');
  });

  it('filters by resource', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/permissions?resource=USER`)
      .expect(200);

    expect(res.body.total).toBe(4);
    res.body.data.forEach((p: { resource: string }) => expect(p.resource).toBe('USER'));
  });

  it('rejects unknown query fields with 422', async () => {
    await request(app.getHttpServer())
      .get(`/api/v${API_VERSION}/admin/permissions?evil=1`)
      .expect(422);
  });
});
