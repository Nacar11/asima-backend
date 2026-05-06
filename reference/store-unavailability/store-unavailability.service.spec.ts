import { BadRequestException } from '@nestjs/common';
import { StoreUnavailabilityService } from '@/store-unavailability/store-unavailability.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';

describe('StoreUnavailabilityService', () => {
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findOverlapsForWindow: jest.Mock;
  };
  let sellersService: {
    findById: jest.Mock;
  };
  let servicesService: {
    findById: jest.Mock;
  };
  let bookingRepository: {
    findOverlappingBookings: jest.Mock;
  };
  let service: StoreUnavailabilityService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOverlapsForWindow: jest.fn(),
    };
    sellersService = {
      findById: jest.fn().mockResolvedValue({ id: 7 }),
    };
    servicesService = {
      findById: jest.fn().mockResolvedValue({ id: 11, seller_id: 7 }),
    };
    bookingRepository = {
      findOverlappingBookings: jest.fn().mockResolvedValue([]),
    };

    service = new StoreUnavailabilityService(
      repository as any,
      sellersService as any,
      servicesService as any,
      bookingRepository as any,
      { publishAvailabilityChanged: jest.fn() } as any, // availabilityRealtimeService
    );
  });

  it('creates unavailability when the selected window is still free', async () => {
    repository.findOverlapsForWindow.mockResolvedValue([]);
    repository.create.mockImplementation(async (payload: any) => ({
      id: 1,
      ...payload,
    }));

    const result = await service.create(
      {
        seller_id: 7,
        service_id: 11,
        unavailable_date: '2026-12-31',
        start_time: '13:00:00',
        end_time: '16:00:00',
        is_full_day: false,
        reason: 'Admin block',
      },
      { id: 99 } as any,
    );

    expect(repository.findOverlapsForWindow).toHaveBeenCalledWith({
      seller_id: 7,
      service_id: 11,
      date: '2026-12-31',
      start_time: '13:00:00',
      end_time: '16:00:00',
    });
    expect(bookingRepository.findOverlappingBookings).toHaveBeenCalledWith({
      seller_id: 7,
      service_id: 11,
      date: '2026-12-31',
      start_time: '13:00:00',
      end_time: '16:00:00',
      statuses: [
        BookingStatusEnum.PENDING,
        BookingStatusEnum.AWAITING_CONFIRMATION,
        BookingStatusEnum.CONFIRMED,
        BookingStatusEnum.IN_PROGRESS,
        BookingStatusEnum.COMPLETED,
      ],
    });
    expect(result).toMatchObject({
      seller_id: 7,
      service_id: 11,
      unavailable_date: '2026-12-31',
    });
  });

  it('rejects creation when an overlapping block already exists', async () => {
    repository.findOverlapsForWindow.mockResolvedValue([
      { id: 123, seller_id: 7 },
    ]);

    await expect(
      service.create(
        {
          seller_id: 7,
          service_id: 11,
          unavailable_date: '2026-12-31',
          start_time: '13:00:00',
          end_time: '16:00:00',
          is_full_day: false,
        },
        { id: 99 } as any,
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Selected schedule is already blocked. Please refresh and try again.',
      ),
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects creation when an overlapping booking already exists', async () => {
    repository.findOverlapsForWindow.mockResolvedValue([]);
    bookingRepository.findOverlappingBookings.mockResolvedValue([
      { id: 456, status: BookingStatusEnum.CONFIRMED },
    ]);

    await expect(
      service.create(
        {
          seller_id: 7,
          service_id: 11,
          unavailable_date: '2026-12-31',
          start_time: '13:00:00',
          end_time: '16:00:00',
          is_full_day: false,
        },
        { id: 99 } as any,
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Selected schedule overlaps an existing booking and can no longer be blocked. Please refresh and try again.',
      ),
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('ignores the current record when validating overlaps during update', async () => {
    repository.findById.mockResolvedValue({
      id: 55,
      seller_id: 7,
      service_id: 11,
      unavailable_date: '2026-12-31',
      end_date: null,
      start_time: '13:00:00',
      end_time: '16:00:00',
      is_full_day: false,
      reason: null,
      status: 'Active',
    });
    repository.findOverlapsForWindow.mockResolvedValue([
      { id: 55, seller_id: 7 },
    ]);
    repository.update.mockImplementation(async (id: number, payload: any) => ({
      id,
      ...payload,
    }));

    const result = await service.update(
      55,
      {
        reason: 'Updated notes',
      },
      { id: 99 } as any,
    );

    expect(repository.update).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        reason: 'Updated notes',
        seller_id: 7,
        service_id: 11,
      }),
    );
    expect(result).toMatchObject({
      id: 55,
      reason: 'Updated notes',
    });
  });
});
