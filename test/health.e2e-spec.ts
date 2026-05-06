import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_VERSION } from '../src/utils/constants/api.constants';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    dataSource = moduleFixture.get(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /api/v${API_VERSION}/health returns 200 with database 'up' when DB is reachable`, async () => {
    const res = await request(app.getHttpServer()).get(`/api/v${API_VERSION}/health`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it(`GET /api/v${API_VERSION}/health returns 503 when DB is unreachable`, async () => {
    // Simulate DB outage by destroying the connection pool
    await dataSource.destroy();

    const res = await request(app.getHttpServer()).get(`/api/v${API_VERSION}/health`);
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'error', database: 'down' });
  });
});
