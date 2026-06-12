import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { BaseStorageService } from '../src/storage/base-storage.service';
import { AttachmentService } from '../src/storage/attachment.service';
import { AttachmentEntity } from '../src/storage/persistence/entities/attachment.entity';
import { API_VERSION } from '../src/utils/constants/api.constants';
import validationOptions from '../src/utils/validation-options';
import { PermissionSeedService } from '../src/database/seeds/permission/permission-seed.service';
import { RoleSeedService } from '../src/database/seeds/role/role-seed.service';
import { UserSeedService } from '../src/database/seeds/user/user-seed.service';
import { WorkScheduleSeedService } from '../src/database/seeds/work-schedule/work-schedule-seed.service';
import { PermissionEntity } from '../src/permissions/persistence/entities/permission.entity';
import { RoleEntity } from '../src/roles/persistence/entities/role.entity';
import { UserEntity } from '../src/users/persistence/entities/user.entity';
import { WorkScheduleEntity } from '../src/work-schedules/persistence/entities/work-schedule.entity';
import { LeaveAllocationEntity } from '../src/leave-allocations/persistence/entities/leave-allocation.entity';

const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Asima@1234';
const cred = (email: string) => ({ email, password: SEED_PASSWORD });

describe('Leave Requests (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let storage: BaseStorageService;
  let attachmentService: AttachmentService;
  let pngFixture: Buffer;
  const pdfFixture = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');

  const tokens: Record<string, string> = {};
  const ids: Record<string, number> = {};

  const url = (p: string) => `/api/v${API_VERSION}${p}`;
  const auth = (token: string) => (req: request.Test) =>
    req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forFeature([
          PermissionEntity,
          RoleEntity,
          UserEntity,
          WorkScheduleEntity,
          LeaveAllocationEntity,
        ]),
      ],
      providers: [PermissionSeedService, RoleSeedService, UserSeedService, WorkScheduleSeedService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    dataSource = moduleFixture.get(DataSource);
    storage = moduleFixture.get(BaseStorageService);
    attachmentService = moduleFixture.get(AttachmentService);
    pngFixture = await sharp({
      create: { width: 120, height: 90, channels: 3, background: { r: 30, g: 90, b: 180 } },
    })
      .png()
      .toBuffer();
    await dataSource.query(
      'TRUNCATE TABLE leave_allocations, leave_requests, approval_chains, work_schedules, time_entries, role_permissions, users, roles, permissions ' +
        'RESTART IDENTITY CASCADE',
    );
    await moduleFixture.get(PermissionSeedService).run();
    await moduleFixture.get(RoleSeedService).run();
    await moduleFixture.get(UserSeedService).run();
    // Work schedules are required now that submit enforces work-schedule-aware
    // date rules (D8): every employee gets a Mon–Fri schedule.
    await moduleFixture.get(WorkScheduleSeedService).run();

    await app.init();

    const people: Record<string, string> = {
      admin: 'admin@asima.inc',
      hr: 'jane_smith@asima.inc',
      emma: 'emma_thompson@asima.inc',
      liam: 'liam_garcia@asima.inc',
      karen: 'karen_taylor@asima.inc', // L1 (TD)
      james: 'james_wilson@asima.inc', // L2 (PM)
      michael: 'michael_jones@asima.inc', // TD not on emma's chain
    };
    for (const [key, email] of Object.entries(people)) {
      const res = await request(app.getHttpServer()).post(url('/auth/login')).send(cred(email));
      tokens[key] = res.body.access_token;
      ids[key] = res.body.user.id;
    }

    // Assign emma's chain: L1 = karen, L2 = james.
    await auth(tokens.admin)(
      request(app.getHttpServer())
        .patch(url(`/admin/approvers/${ids.emma}`))
        .send({ l1_approver_id: ids.karen, l2_approver_id: ids.james }),
    ).expect(200);

    // emma starts with 10 vacation + 10 sick (default). Grant emergency so the
    // reject-flow cases below have balance — exercises the admin grant endpoint.
    await auth(tokens.admin)(
      request(app.getHttpServer())
        .post(url(`/admin/users/${ids.emma}/leave-allocations`))
        .send({ leave_type: 'emergency', amount: 20 }),
    ).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('submit', () => {
    it('hard-blocks submission when the employee has no chain (422)', async () => {
      const res = await auth(tokens.liam)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'vacation', start_date: '2026-07-01', end_date: '2026-07-03' }),
      ).expect(422);
      expect(res.body.errors.approval_chain).toBeDefined();
    });

    it('snapshots the chain and starts at pending_l1', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/leave-requests')).send({
          leave_type: 'vacation',
          start_date: '2026-07-01', // Wed
          end_date: '2026-07-03', // Fri (both workdays; Sun end would fail D8)
          reason: 'Family trip',
        }),
      ).expect(201);

      expect(res.body.status).toBe('pending_l1');
      expect(res.body.l1_approver_id).toBe(ids.karen);
      expect(res.body.l2_approver_id).toBe(ids.james);
    });

    it('rejects an overlapping request (422 dates)', async () => {
      // vacation needs no attachment, so this exercises the overlap rule cleanly.
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'vacation', start_date: '2026-07-03', end_date: '2026-07-08' }),
      ).expect(422);
      expect(res.body.errors.dates).toBeDefined();
    });

    // Shared across the half-day submit + the admin-recompute edit below.
    let halfDayId: number;

    it('submits a first-half day: 0.5 working day, window, and 0.5 reserved', async () => {
      // 2026-07-06 is a Monday; emma already has 3 vacation days pending above.
      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url('/users/me/leave-requests')).send({
          leave_type: 'vacation',
          start_date: '2026-07-06',
          end_date: '2026-07-06',
          day_portion: 'first_half',
        }),
      ).expect(201);
      expect(res.body.day_portion).toBe('first_half');
      expect(res.body.working_days).toBe(0.5);
      expect(res.body.start_time).toBe('09:00:00');
      expect(res.body.end_time).toBe('14:00:00');
      halfDayId = res.body.id;

      const bal = await auth(tokens.emma)(
        request(app.getHttpServer()).get(url('/users/me/leave-balances')),
      ).expect(200);
      const vacation = bal.body.find((b: { leave_type: string }) => b.leave_type === 'vacation');
      expect(vacation.reserved).toBe(3.5); // 3 (pending 3-day) + 0.5 (this half day)
    });

    it('HR editing the portion recomputes working_days + clears the window', async () => {
      // admin is system_admin (bypasses the LEAVE:Update gate). Promote the
      // half day back to a full single day → working_days 1, window cleared.
      const res = await auth(tokens.admin)(
        request(app.getHttpServer())
          .patch(url(`/admin/leave-requests/${halfDayId}`))
          .send({ day_portion: 'full' }),
      ).expect(200);
      expect(res.body.day_portion).toBe('full');
      expect(res.body.working_days).toBe(1);
      expect(res.body.start_time).toBeNull();
      expect(res.body.end_time).toBeNull();
    });
  });

  describe('attachments (sick / bereavement)', () => {
    it('422 when sick leave is submitted without a file', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'sick', start_date: '2027-03-01', end_date: '2027-03-01' }),
      ).expect(422);
      expect(res.body.errors.attachment).toBeDefined();
    });

    it('422 when a vacation submit carries a file (type does not accept one)', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'vacation')
          .field('start_date', '2027-03-08')
          .field('end_date', '2027-03-08')
          .attach('file', pngFixture, 'whatever.png'),
      ).expect(422);
      expect(res.body.errors.attachment).toBeDefined();
    });

    it('422 when the file is an unsupported type (sniffed, not trusted)', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2027-03-15')
          .field('end_date', '2027-03-15')
          // A text file masquerading as a PNG by filename — rejected on bytes.
          .attach('file', Buffer.from('not really an image'), 'fake.png'),
      ).expect(422);
      expect(res.body.errors.file).toBeDefined();
    });

    it('201 with a valid image → links the attachment and stores 3 versions', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2027-04-01')
          .field('end_date', '2027-04-01')
          .attach('file', pngFixture, 'medical-cert.png'),
      ).expect(201);

      expect(res.body.attachment_id).toEqual(expect.any(Number));

      const row = await dataSource
        .getRepository(AttachmentEntity)
        .findOneByOrFail({ id: res.body.attachment_id });
      expect(row.kind).toBe('image');
      expect(row.has_versions).toBe(true);
      expect(row.original_filename).toBe('medical-cert.png');
      expect(row.owner_id).toBe(ids.emma);

      // All three renditions are in storage.
      await expect(storage.exists(attachmentService.objectKeyFor(row, 'original'))).resolves.toBe(
        true,
      );
      await expect(storage.exists(attachmentService.objectKeyFor(row, 'preview'))).resolves.toBe(
        true,
      );
      await expect(storage.exists(attachmentService.objectKeyFor(row, 'thumbnail'))).resolves.toBe(
        true,
      );
    });

    it('201 with a PDF → stores original only (no versions)', async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2027-04-08')
          .field('end_date', '2027-04-08')
          .attach('file', pdfFixture, 'doctor-note.pdf'),
      ).expect(201);

      const row = await dataSource
        .getRepository(AttachmentEntity)
        .findOneByOrFail({ id: res.body.attachment_id });
      expect(row.kind).toBe('pdf');
      expect(row.has_versions).toBe(false);

      await expect(storage.exists(attachmentService.objectKeyFor(row, 'original'))).resolves.toBe(
        true,
      );
      await expect(storage.exists(attachmentService.objectKeyFor(row, 'preview'))).resolves.toBe(
        false,
      );
    });
  });

  describe('attachment download', () => {
    let imageReqId: number;
    let pdfReqId: number;

    beforeAll(async () => {
      const img = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2027-05-03')
          .field('end_date', '2027-05-03')
          .attach('file', pngFixture, 'scan.png'),
      ).expect(201);
      imageReqId = img.body.id;

      const pdf = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2027-05-10')
          .field('end_date', '2027-05-10')
          .attach('file', pdfFixture, 'note.pdf'),
      ).expect(201);
      pdfReqId = pdf.body.id;
    });

    const download = (token: string, id: number, version?: string) => {
      const req = auth(token)(
        request(app.getHttpServer()).get(url(`/leave-requests/${id}/attachment`)),
      );
      return version ? req.query({ version }) : req;
    };

    it('owner downloads the original (200) with a content-disposition filename', async () => {
      const res = await download(tokens.emma, imageReqId).buffer().expect(200);
      expect(res.headers['content-disposition']).toContain('scan.png');
    });

    it('owner downloads the preview + thumbnail renditions (200)', async () => {
      await download(tokens.emma, imageReqId, 'preview').buffer().expect(200);
      await download(tokens.emma, imageReqId, 'thumbnail').buffer().expect(200);
    });

    it('the snapshotted L1 approver can download (200)', async () => {
      await download(tokens.karen, imageReqId).buffer().expect(200);
    });

    it('an unrelated employee is forbidden (403)', async () => {
      await download(tokens.liam, imageReqId).expect(403);
    });

    it('a missing request is 404', async () => {
      await download(tokens.emma, 99999999).expect(404);
    });

    it('a preview of a PDF attachment is 404 (no such rendition)', async () => {
      await download(tokens.emma, pdfReqId, 'preview').expect(404);
    });

    it('the original of a PDF attachment is 200', async () => {
      await download(tokens.emma, pdfReqId).buffer().expect(200);
    });
  });

  describe('day-count preview — half day', () => {
    // emma's seeded schedule: Mon–Fri 09:00–18:00, lunch 12:00 for 60m.
    // 2026-07-06 is a Monday (workday).
    const dayCount = (params: Record<string, string>) =>
      auth(tokens.emma)(
        request(app.getHttpServer()).get(url('/users/me/leave-requests/day-count')).query(params),
      );

    it('first_half returns 0.5 day and the 09:00–14:00 window', async () => {
      const res = await dayCount({
        start_date: '2026-07-06',
        end_date: '2026-07-06',
        day_portion: 'first_half',
        leave_type: 'vacation',
      }).expect(200);
      expect(res.body.working_days).toBe(0.5);
      expect(res.body.start_time).toBe('09:00:00');
      expect(res.body.end_time).toBe('14:00:00');
    });

    it('second_half returns 0.5 day and the 14:00–18:00 window', async () => {
      const res = await dayCount({
        start_date: '2026-07-06',
        end_date: '2026-07-06',
        day_portion: 'second_half',
        leave_type: 'vacation',
      }).expect(200);
      expect(res.body.working_days).toBe(0.5);
      expect(res.body.start_time).toBe('14:00:00');
      expect(res.body.end_time).toBe('18:00:00');
    });

    it('rejects a half-day spanning two days (422)', async () => {
      const res = await dayCount({
        start_date: '2026-07-06',
        end_date: '2026-07-07',
        day_portion: 'first_half',
        leave_type: 'vacation',
      }).expect(422);
      expect(res.body.errors.day_portion).toBeDefined();
    });

    it('rejects a half-day birthday request (422 whole-day-only)', async () => {
      const res = await dayCount({
        start_date: '2026-07-06',
        end_date: '2026-07-06',
        day_portion: 'first_half',
        leave_type: 'birthday',
      }).expect(422);
      expect(res.body.errors.day_portion).toBeDefined();
    });
  });

  describe('approval flow', () => {
    let reqId: number;

    beforeAll(async () => {
      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).get(url('/users/me/leave-requests')),
      ).expect(200);
      reqId = res.body.data[0].id;
    });

    it('forbids an off-chain LEAVE:Approve holder (403)', async () => {
      const res = await auth(tokens.michael)(
        request(app.getHttpServer()).post(url(`/leave-requests/${reqId}/approve`)),
      ).expect(403);
      expect(res.body.errors.approver).toBeDefined();
    });

    it('L1 sees it in the approvals inbox before acting', async () => {
      const res = await auth(tokens.karen)(
        request(app.getHttpServer()).get(url('/approvals/pending?type=leave')),
      ).expect(200);
      expect(res.body.data.some((r: { id: number }) => r.id === reqId)).toBe(true);
    });

    it('L1 approves → pending_l2', async () => {
      const res = await auth(tokens.karen)(
        request(app.getHttpServer()).post(url(`/leave-requests/${reqId}/approve`)),
      ).expect(200);
      expect(res.body.status).toBe('pending_l2');
      expect(res.body.decision_path).toBe('chain');
    });

    it('after L1 approval the item leaves L1 inbox and enters L2 inbox', async () => {
      const l1 = await auth(tokens.karen)(
        request(app.getHttpServer()).get(url('/approvals/pending?type=leave')),
      ).expect(200);
      expect(l1.body.data.some((r: { id: number }) => r.id === reqId)).toBe(false);

      const l2 = await auth(tokens.james)(
        request(app.getHttpServer()).get(url('/approvals/pending?type=leave')),
      ).expect(200);
      expect(l2.body.data.some((r: { id: number }) => r.id === reqId)).toBe(true);
    });

    it('L2 approves → approved', async () => {
      const res = await auth(tokens.james)(
        request(app.getHttpServer()).post(url(`/leave-requests/${reqId}/approve`)),
      ).expect(200);
      expect(res.body.status).toBe('approved');
    });
  });

  describe('HR override path', () => {
    it('an ApproveAny holder force-approves from pending_l1 (decision_path=override)', async () => {
      // sick now requires an attachment → multipart submit with a file.
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .field('leave_type', 'sick')
          .field('start_date', '2026-08-03')
          .field('end_date', '2026-08-05')
          .attach('file', pdfFixture, 'note.pdf'),
      ).expect(201);

      const res = await auth(tokens.hr)(
        request(app.getHttpServer()).post(url(`/leave-requests/${submit.body.id}/approve`)),
      ).expect(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.decision_path).toBe('override');
    });
  });

  describe('reject + cancel', () => {
    it('L1 rejects with a note', async () => {
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'emergency', start_date: '2026-09-01', end_date: '2026-09-02' }),
      ).expect(201);

      const res = await auth(tokens.karen)(
        request(app.getHttpServer())
          .post(url(`/leave-requests/${submit.body.id}/reject`))
          .send({ note: 'No coverage that week' }),
      ).expect(200);
      expect(res.body.status).toBe('rejected');
      expect(res.body.decision_note).toBe('No coverage that week');
    });

    it('a rejection with no note is rejected by DTO validation (422)', async () => {
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'emergency', start_date: '2026-10-01', end_date: '2026-10-02' }),
      ).expect(201);

      const res = await auth(tokens.karen)(
        request(app.getHttpServer())
          .post(url(`/leave-requests/${submit.body.id}/reject`))
          .send({}),
      ).expect(422);
      expect(res.body.errors.note).toBeDefined();
    });

    it('requester cancels their own pending request', async () => {
      const submit = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'vacation', start_date: '2026-11-02', end_date: '2026-11-03' }),
      ).expect(201);

      const res = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url(`/users/me/leave-requests/${submit.body.id}/cancel`)),
      ).expect(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('cancels an APPROVED, not-yet-elapsed request and frees the balance', async () => {
      const vacationAvailable = async (): Promise<number> => {
        const bal = await auth(tokens.emma)(
          request(app.getHttpServer()).get(url('/users/me/leave-balances')),
        ).expect(200);
        return bal.body.find((b: { leave_type: string }) => b.leave_type === 'vacation').available;
      };

      const before = await vacationAvailable();

      const submit = await auth(tokens.emma)(
        request(app.getHttpServer())
          .post(url('/users/me/leave-requests'))
          .send({ leave_type: 'vacation', start_date: '2026-12-01', end_date: '2026-12-02' }),
      ).expect(201);

      // HR force-approves (override) so the request reaches the `approved` state.
      const approved = await auth(tokens.hr)(
        request(app.getHttpServer()).post(url(`/leave-requests/${submit.body.id}/approve`)),
      ).expect(200);
      expect(approved.body.status).toBe('approved');

      // New rule: an approved request whose dates are still in the future is
      // cancellable by the requester.
      const cancelled = await auth(tokens.emma)(
        request(app.getHttpServer()).post(url(`/users/me/leave-requests/${submit.body.id}/cancel`)),
      ).expect(200);
      expect(cancelled.body.status).toBe('cancelled');

      // Balance is derived from status, so cancelling returns the days.
      expect(await vacationAvailable()).toBe(before);
    });
  });

  describe('authorization boundaries', () => {
    it('an EMPLOYEE cannot list the admin leave view (403)', async () => {
      await auth(tokens.emma)(
        request(app.getHttpServer()).get(url('/admin/leave-requests')),
      ).expect(403);
    });

    it('an EMPLOYEE without APPROVAL:View cannot open the approvals inbox (403)', async () => {
      await auth(tokens.emma)(request(app.getHttpServer()).get(url('/approvals/pending'))).expect(
        403,
      );
    });

    it('HR with ViewAll lists every request, each row carrying the joined employee_name', async () => {
      const res = await auth(tokens.hr)(
        request(app.getHttpServer()).get(url('/admin/leave-requests')),
      ).expect(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      // List read-model resolves the requester name in one trip (no client-side map).
      expect(typeof res.body.data[0].employee_name).toBe('string');
      expect(res.body.data[0].employee_name.length).toBeGreaterThan(0);
      // …and the approver/decider names from the same joined read-model.
      const row = res.body.data[0];
      expect('l1_approver_name' in row).toBe(true);
      expect('l2_approver_name' in row).toBe(true);
      expect('decided_by_name' in row).toBe(true);
      // L1 approver is always assigned, so its name resolves to a non-empty string.
      expect(typeof row.l1_approver_name).toBe('string');
      expect(row.l1_approver_name.length).toBeGreaterThan(0);
    });
  });
});
