import {
  ConflictException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { BaseTimeEntryRepository } from './persistence/base-time-entry.repository';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { TimeEntryRecord } from './domain/time-entry';
import {
  TimeEntryClosed,
  TimeEntryCorrected,
  TimeEntryOpened,
} from './domain/events/time-entry-events';
import { TIME_ENTRY_SOURCES, TIME_ENTRY_STATUSES } from './time-entries.constants';

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let repo: jest.Mocked<BaseTimeEntryRepository>;
  let publisher: { publish: jest.Mock };

  const fakeOpenEntry: TimeEntryRecord = {
    id: 10,
    employee_id: 12,
    work_date: '2026-05-07',
    time_in: new Date('2026-05-07T09:00:00Z'),
    time_out: null,
    source: TIME_ENTRY_SOURCES.manual,
    status: TIME_ENTRY_STATUSES.open,
    notes: null,
    created_by: 12,
    updated_by: 12,
    deleted_by: null,
    created_at: new Date('2026-05-07T09:00:00Z'),
    updated_at: new Date('2026-05-07T09:00:00Z'),
    deleted_at: null,
  };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findOpenForEmployee: jest.fn(),
      findLatestForEmployee: jest.fn(),
      existsForEmployeeDate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    publisher = { publish: jest.fn() };
    service = new TimeEntriesService(
      repo as unknown as BaseTimeEntryRepository,
      publisher as unknown as DomainEventPublisher,
    );
  });

  describe('punch (toggle)', () => {
    it('creates a new open entry when no open entry exists and publishes TimeEntryOpened', async () => {
      repo.findOpenForEmployee.mockResolvedValue(null);
      repo.create.mockResolvedValue(fakeOpenEntry);

      const result = await service.punch({ id: 12 });

      expect(result).toBe(fakeOpenEntry);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_id: 12,
          source: TIME_ENTRY_SOURCES.manual,
          status: TIME_ENTRY_STATUSES.open,
          time_out: null,
          created_by: 12,
        }),
      );
      expect(repo.update).not.toHaveBeenCalled();
      expect(publisher.publish).toHaveBeenCalledWith([expect.any(TimeEntryOpened)]);
    });

    it('closes the existing open entry (narrow patch) and publishes TimeEntryClosed', async () => {
      repo.findOpenForEmployee.mockResolvedValue(fakeOpenEntry);
      const closed: TimeEntryRecord = {
        ...fakeOpenEntry,
        time_out: new Date(),
        status: TIME_ENTRY_STATUSES.confirmed,
      };
      repo.update.mockResolvedValue(closed);

      const result = await service.punch({ id: 12 });

      expect(result).toBe(closed);
      // Narrow patch — only the three fields the close transition touches.
      expect(repo.update).toHaveBeenCalledWith(fakeOpenEntry.id, {
        status: TIME_ENTRY_STATUSES.confirmed,
        time_out: expect.any(Date),
        updated_by: 12,
      });
      expect(repo.create).not.toHaveBeenCalled();
      const published = publisher.publish.mock.calls[0][0];
      expect(published[0]).toBeInstanceOf(TimeEntryClosed);
      expect(published[0].time_entry_id).toBe(10);
    });

    it('maps a Postgres unique-violation on insert to 409 ConflictException', async () => {
      // Simulates the partial unique index firing because two punches raced
      // and both saw "no open entry". This is the behavior the DB-level
      // seam guarantees.
      repo.findOpenForEmployee.mockResolvedValue(null);
      const pgErr = Object.assign(new Error('duplicate key'), { code: '23505' });
      repo.create.mockRejectedValue(pgErr);

      await expect(service.punch({ id: 12 })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('punch cooldown', () => {
    it('rejects a punch less than 5 minutes after the last event (429)', async () => {
      const threeMinAgo = new Date(Date.now() - 3 * 60_000);
      repo.findOpenForEmployee.mockResolvedValue(null);
      repo.findLatestForEmployee.mockResolvedValue({
        ...fakeOpenEntry,
        time_in: new Date(threeMinAgo.getTime() - 60_000),
        time_out: threeMinAgo,
        status: TIME_ENTRY_STATUSES.confirmed,
      });

      expect.assertions(3);
      try {
        await service.punch({ id: 12 });
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(429);
      }
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('allows a punch when the last event was more than 5 minutes ago', async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60_000);
      repo.findOpenForEmployee.mockResolvedValue(null);
      repo.findLatestForEmployee.mockResolvedValue({
        ...fakeOpenEntry,
        time_in: tenMinAgo,
        time_out: tenMinAgo,
        status: TIME_ENTRY_STATUSES.confirmed,
      });
      repo.create.mockResolvedValue(fakeOpenEntry);

      await expect(service.punch({ id: 12 })).resolves.toBe(fakeOpenEntry);
    });

    it('allows the first-ever punch (no prior entry)', async () => {
      repo.findOpenForEmployee.mockResolvedValue(null);
      repo.findLatestForEmployee.mockResolvedValue(null);
      repo.create.mockResolvedValue(fakeOpenEntry);

      await expect(service.punch({ id: 12 })).resolves.toBe(fakeOpenEntry);
    });
  });

  describe('create (admin manual)', () => {
    it('rejects creating a second open entry with 422', async () => {
      repo.findOpenForEmployee.mockResolvedValue(fakeOpenEntry);

      await expect(
        service.create({
          employee_id: 12,
          work_date: '2026-05-07',
          time_in: new Date('2026-05-07T10:00:00Z'),
          // time_out omitted → would create another open entry
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects time_out <= time_in with 422 (without hitting the DB)', async () => {
      repo.findOpenForEmployee.mockResolvedValue(null);

      await expect(
        service.create({
          employee_id: 12,
          work_date: '2026-05-07',
          time_in: new Date('2026-05-07T18:00:00Z'),
          time_out: new Date('2026-05-07T09:00:00Z'),
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a confirmed segment when both punches provided and publishes TimeEntryOpened', async () => {
      repo.findOpenForEmployee.mockResolvedValue(null);
      const created: TimeEntryRecord = {
        ...fakeOpenEntry,
        time_out: new Date('2026-05-07T18:00:00Z'),
        status: TIME_ENTRY_STATUSES.confirmed,
        source: TIME_ENTRY_SOURCES.admin,
      };
      repo.create.mockResolvedValue(created);

      const result = await service.create({
        employee_id: 12,
        work_date: '2026-05-07',
        time_in: new Date('2026-05-07T09:00:00Z'),
        time_out: new Date('2026-05-07T18:00:00Z'),
        created_by: 1,
      });

      expect(result).toBe(created);
      // findOpenForEmployee should NOT be consulted when time_out is set —
      // a confirmed segment doesn't conflict with an open one.
      expect(repo.findOpenForEmployee).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TIME_ENTRY_STATUSES.confirmed,
          source: TIME_ENTRY_SOURCES.admin,
        }),
      );
      expect(publisher.publish).toHaveBeenCalledWith([expect.any(TimeEntryOpened)]);
    });
  });

  describe('softDelete', () => {
    it('throws 404 when the entry does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.softDelete(999, 1)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('passes deleted_by through to the repository', async () => {
      repo.findById.mockResolvedValue(fakeOpenEntry);
      repo.softDelete.mockResolvedValue(undefined);

      await service.softDelete(10, 5);

      expect(repo.softDelete).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('update', () => {
    it('throws 404 when the entry does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update(999, { notes: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects time_out <= existing time_in with 422', async () => {
      repo.findById.mockResolvedValue(fakeOpenEntry);

      await expect(
        service.update(10, { time_out: new Date('2026-05-07T08:00:00Z') }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('derives status=confirmed when time_out is provided, and publishes NO event', async () => {
      repo.findById.mockResolvedValue(fakeOpenEntry);
      repo.update.mockResolvedValue({ ...fakeOpenEntry, status: TIME_ENTRY_STATUSES.confirmed });

      await service.update(10, { time_out: new Date('2026-05-07T18:00:00Z') });

      expect(repo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ status: TIME_ENTRY_STATUSES.confirmed }),
      );
      // An admin edit is not a downstream timesheet fact (decision #5/#6).
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('clears time_out to open when the patch sets it to null (=== !== undefined merge)', async () => {
      const confirmed: TimeEntryRecord = {
        ...fakeOpenEntry,
        time_out: new Date('2026-05-07T18:00:00Z'),
        status: TIME_ENTRY_STATUSES.confirmed,
      };
      repo.findById.mockResolvedValue(confirmed);
      repo.update.mockResolvedValue({
        ...confirmed,
        time_out: null,
        status: TIME_ENTRY_STATUSES.open,
      });

      await service.update(10, { time_out: null });

      expect(repo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ time_out: null, status: TIME_ENTRY_STATUSES.open }),
      );
    });
  });

  describe('hasEntryOnDate', () => {
    it('reports whether the employee already has a (non-deleted) entry on a date', async () => {
      repo.existsForEmployeeDate.mockResolvedValue(true);
      await expect(service.hasEntryOnDate(12, '2026-06-13')).resolves.toBe(true);
      expect(repo.existsForEmployeeDate).toHaveBeenCalledWith(12, '2026-06-13');
    });
  });

  describe('applyCorrection', () => {
    const manualAdd = {
      employee_id: 12,
      target_entry_id: null,
      work_date: '2026-06-13',
      proposed_time_in: new Date('2026-06-13T09:00:00Z'),
      proposed_time_out: new Date('2026-06-13T18:00:00Z'),
      decided_by: 5,
    };

    it('rejects an invalid proposed window with 422 keyed on proposed_time_out', async () => {
      await expect(
        service.applyCorrection({
          ...manualAdd,
          proposed_time_in: new Date('2026-06-13T18:00:00Z'),
          proposed_time_out: new Date('2026-06-13T09:00:00Z'),
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('rejects with 409 when an entry already exists for the date (TOCTOU re-check)', async () => {
      repo.existsForEmployeeDate.mockResolvedValue(true);

      await expect(service.applyCorrection(manualAdd)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates the new entry (source=correction) when none exists and publishes TimeEntryOpened', async () => {
      repo.existsForEmployeeDate.mockResolvedValue(false);
      repo.findOpenForEmployee.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...fakeOpenEntry, status: TIME_ENTRY_STATUSES.confirmed });

      await service.applyCorrection(manualAdd);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: TIME_ENTRY_SOURCES.correction }),
      );
      expect(publisher.publish).toHaveBeenCalledWith([expect.any(TimeEntryOpened)]);
    });

    it('updates the target (work_date + correction source) and publishes TimeEntryCorrected', async () => {
      repo.findById.mockResolvedValue(fakeOpenEntry);
      repo.update.mockResolvedValue({ ...fakeOpenEntry, status: TIME_ENTRY_STATUSES.confirmed });

      await service.applyCorrection({ ...manualAdd, target_entry_id: 10, work_date: '2026-06-20' });

      // The existing-entry TOCTOU guard does NOT run on the target path.
      expect(repo.existsForEmployeeDate).not.toHaveBeenCalled();
      // work_date moves with the correction (frozen contract — decision #7).
      expect(repo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          work_date: '2026-06-20',
          source: TIME_ENTRY_SOURCES.correction,
          status: TIME_ENTRY_STATUSES.confirmed,
          updated_by: 5,
        }),
      );
      const published = publisher.publish.mock.calls[0][0];
      expect(published[0]).toBeInstanceOf(TimeEntryCorrected);
      expect(published[0].time_entry_id).toBe(10);
    });
  });
});
