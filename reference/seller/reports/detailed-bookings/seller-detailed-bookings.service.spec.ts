import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { OpenPlayEventEntity } from '@/guest-venue-booking/persistence/entities/open-play-event.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StorageService } from '@/storage/storage.service';
import { AvailabilityRealtimeService } from '@/availability-realtime/availability-realtime.service';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { User } from '@/users/domain/user';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { SellerDetailedBookingsService } from './seller-detailed-bookings.service';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('SellerDetailedBookingsService', () => {
  let service: SellerDetailedBookingsService;

  let bookingRepository: jest.Mocked<Repository<BookingEntity>>;
  let escrowTransactionRepository: jest.Mocked<
    Repository<EscrowTransactionEntity>
  >;
  let checkoutPaymentRepository: jest.Mocked<Repository<CheckoutPaymentEntity>>;
  let checkoutPaymentOrderRepository: jest.Mocked<
    Repository<CheckoutPaymentOrderEntity>
  >;
  let storeUnavailabilityRepository: jest.Mocked<
    Repository<StoreUnavailabilityEntity>
  >;
  let openPlayEventRepository: jest.Mocked<Repository<OpenPlayEventEntity>>;
  let availabilityRealtimeService: jest.Mocked<AvailabilityRealtimeService>;

  const sellerUser: User = {
    id: 100,
    first_name: 'Seller',
    last_name: 'User',
    email: 'seller@example.com',
    system_admin: false,
    seller_id: 77,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerDetailedBookingsService,
        {
          provide: getRepositoryToken(BookingEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(EscrowTransactionEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CheckoutPaymentEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(CheckoutPaymentOrderEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(StoreUnavailabilityEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OpenPlayEventEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderVoucherEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: StorageService,
          useValue: {
            getSignedUrl: jest.fn(),
          },
        },
        {
          provide: AvailabilityRealtimeService,
          useValue: {
            publishAvailabilityChanged: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SellerDetailedBookingsService>(
      SellerDetailedBookingsService,
    );
    bookingRepository = module.get(getRepositoryToken(BookingEntity));
    escrowTransactionRepository = module.get(
      getRepositoryToken(EscrowTransactionEntity),
    );
    checkoutPaymentRepository = module.get(
      getRepositoryToken(CheckoutPaymentEntity),
    );
    checkoutPaymentOrderRepository = module.get(
      getRepositoryToken(CheckoutPaymentOrderEntity),
    );
    storeUnavailabilityRepository = module.get(
      getRepositoryToken(StoreUnavailabilityEntity),
    );
    openPlayEventRepository = module.get(
      getRepositoryToken(OpenPlayEventEntity),
    );
    availabilityRealtimeService = module.get(AvailabilityRealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load rows before count to avoid concurrent pagination/count execution', async () => {
    const escrowSubQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('SELECT 1'),
      getParameters: jest.fn().mockReturnValue({}),
    };
    escrowTransactionRepository.createQueryBuilder.mockReturnValue(
      escrowSubQueryBuilder as any,
    );

    const idPageDeferred = createDeferred<Record<string, unknown>[]>();
    const idPageQuery = {
      getRawMany: jest.fn().mockReturnValue(idPageDeferred.promise),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };
    const countQuery = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const bookingQb = {
      leftJoin: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      clone: jest
        .fn()
        .mockReturnValueOnce(idPageQuery as any)
        .mockReturnValueOnce(countQuery as any),
    };
    bookingRepository.createQueryBuilder.mockReturnValue(bookingQb as any);

    const pending = service.findAll({}, sellerUser);

    await Promise.resolve();

    expect(idPageQuery.getRawMany).toHaveBeenCalledTimes(1);
    expect(countQuery.getCount).not.toHaveBeenCalled();

    idPageDeferred.resolve([]);
    const result = await pending;

    expect(countQuery.getCount).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [],
      totalCount: 0,
      skip: 0,
      take: 20,
    });
    expect(checkoutPaymentOrderRepository.find).not.toHaveBeenCalled();
    expect(checkoutPaymentRepository.find).not.toHaveBeenCalled();
  });

  it('should preserve paged booking id order when hydrating detailed rows', async () => {
    const escrowSubQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('SELECT 1'),
      getParameters: jest.fn().mockReturnValue({}),
    };
    escrowTransactionRepository.createQueryBuilder.mockReturnValue(
      escrowSubQueryBuilder as any,
    );

    const idPageQuery = {
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ id: 2 }, { id: 1 }] as Array<{ id: number }>),
    };
    const countQuery = {
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(2),
    };
    const detailsRows = [
      {
        id: 1,
        booking_number: 'BK-1',
        sales_order_id: null,
        sales_order_number: null,
        sales_order_status: null,
        sales_order_payment_method: null,
        sales_order_subtotal: 0,
        sales_order_total_amount: 0,
        sales_order_created_at: null,
        sales_order_items_count: 0,
        scheduled_date: '2026-03-20',
        scheduled_start_time: '10:00:00',
        scheduled_end_time: '11:00:00',
        created_at: '2026-03-19T01:00:00.000Z',
        completed_at: null,
        status: 'awaiting_confirmation',
        customer_name: 'Customer One',
        customer_phone: null,
        guest_count: 1,
        guest_names_summary: null,
        service_title: 'Pickleball Court 1',
        checkout_order_payment_status: 'processing',
        gross_amount: 900,
        total_amount: 900,
        discount_amount: 0,
        platform_fee: 0,
        net_amount: 900,
        released_amount: 0,
        refund_amount: 0,
        deposit_amount: 0,
        failed_deposit_count: 0,
        in_flight_count: 0,
      },
      {
        id: 2,
        booking_number: 'BK-2',
        sales_order_id: null,
        sales_order_number: null,
        sales_order_status: null,
        sales_order_payment_method: null,
        sales_order_subtotal: 0,
        sales_order_total_amount: 0,
        sales_order_created_at: null,
        sales_order_items_count: 0,
        scheduled_date: '2026-03-20',
        scheduled_start_time: '08:00:00',
        scheduled_end_time: '09:00:00',
        created_at: '2026-03-19T00:00:00.000Z',
        completed_at: null,
        status: 'awaiting_confirmation',
        customer_name: 'Customer Two',
        customer_phone: null,
        guest_count: 1,
        guest_names_summary: null,
        service_title: 'Pickleball Court 1',
        checkout_order_payment_status: 'processing',
        gross_amount: 900,
        total_amount: 900,
        discount_amount: 0,
        platform_fee: 0,
        net_amount: 900,
        released_amount: 0,
        refund_amount: 0,
        deposit_amount: 0,
        failed_deposit_count: 0,
        in_flight_count: 0,
      },
    ];
    const detailsQuery = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(detailsRows),
    };

    const bookingQb = {
      leftJoin: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      clone: jest
        .fn()
        .mockReturnValueOnce(idPageQuery as any)
        .mockReturnValueOnce(countQuery as any)
        .mockReturnValueOnce(detailsQuery as any),
    };
    bookingRepository.createQueryBuilder.mockReturnValue(bookingQb as any);

    const result = await service.findAll({}, sellerUser);

    expect(detailsQuery.andWhere).toHaveBeenCalledWith(
      'booking.id IN (:...bookingIds)',
      {
        bookingIds: [2, 1],
      },
    );
    expect(result.totalCount).toBe(2);
    expect(result.data.map((row) => row.id)).toEqual([2, 1]);
    expect(result.data.map((row) => row.booking_number)).toEqual([
      'BK-2',
      'BK-1',
    ]);
    expect(checkoutPaymentOrderRepository.find).not.toHaveBeenCalled();
    expect(checkoutPaymentRepository.find).not.toHaveBeenCalled();
  });

  it('should return grouped sales_orders in findById and dedupe by sales order id', async () => {
    const primaryBooking = {
      id: 1,
      seller_id: 77,
      deleted_at: null,
      booking_number: 'BK-1',
      booking_group_number: 'GRP-20260328',
      service_id: 10,
      scheduled_date: new Date('2026-03-29T00:00:00.000Z'),
      scheduled_start_time: '08:00:00',
      scheduled_end_time: '09:00:00',
      created_at: new Date('2026-03-28T00:51:00.000Z'),
      updated_at: new Date('2026-03-28T01:10:00.000Z'),
      completed_at: null,
      confirmed_at: null,
      cancelled_at: null,
      cancelled_by: null,
      subtotal: 1000,
      discount_amount: 0,
      platform_fee: 0,
      provider_payout: 1000,
      total: 1000,
      status: 'awaiting_confirmation',
      open_play_event_id: null,
      guest_count: 1,
      customer_notes: null,
      provider_notes: null,
      internal_notes: null,
      cancellation_reason: null,
      service_address_text: null,
      sales_order_id: 501,
      sales_order: {
        id: 501,
        order_number: 'ORD-501',
        status: 'confirmed',
        payment_method: 'gcash',
        subtotal: 1000,
        total_amount: 1000,
        created_at: new Date('2026-03-28T00:51:00.000Z'),
        items: [
          {
            id: 1,
            item_type: 'service',
            service: { title: 'Pickleball Court 1' },
            variant: null,
            quantity: 1,
            unit_price: 1000,
            total_price: 1000,
            scheduled_date: new Date('2026-03-29T00:00:00.000Z'),
            scheduled_start_time: '08:00:00',
          },
        ],
      },
      checkout_order: { payment_status: 'processing' },
      booking_guests: [
        {
          id: 11,
          sort_order: 1,
          is_primary_contact: true,
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'ada@example.com',
          phone: '09170000001',
        },
      ],
      customer: {
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        phone: '09170000001',
      },
      cancelled_by_user: null,
    } as any;

    const siblingSameOrder = {
      ...primaryBooking,
      id: 2,
      booking_number: 'BK-2',
      scheduled_start_time: '09:00:00',
      scheduled_end_time: '10:00:00',
      total: 1000,
    } as any;

    const siblingDifferentOrder = {
      ...primaryBooking,
      id: 3,
      booking_number: 'BK-3',
      scheduled_start_time: '10:00:00',
      scheduled_end_time: '11:00:00',
      sales_order_id: 502,
      sales_order: {
        id: 502,
        order_number: 'ORD-502',
        status: 'confirmed',
        payment_method: 'cash',
        subtotal: 1200,
        total_amount: 1200,
        created_at: new Date('2026-03-28T01:00:00.000Z'),
        items: [
          {
            id: 2,
            item_type: 'service',
            service: { title: 'Pickleball Court 2' },
            variant: null,
            quantity: 1,
            unit_price: 1200,
            total_price: 1200,
            scheduled_date: new Date('2026-03-29T00:00:00.000Z'),
            scheduled_start_time: '10:00:00',
          },
        ],
      },
    } as any;

    bookingRepository.findOne.mockResolvedValue(primaryBooking);
    bookingRepository.find.mockResolvedValue([
      primaryBooking,
      siblingSameOrder,
      siblingDifferentOrder,
    ]);
    escrowTransactionRepository.find.mockResolvedValue([]);
    checkoutPaymentOrderRepository.find.mockResolvedValue([]);
    checkoutPaymentRepository.findOne.mockResolvedValue(null);

    const result = await service.findById(1, sellerUser);

    expect(result.sales_orders).toEqual([
      expect.objectContaining({
        id: 501,
        order_number: 'ORD-501',
      }),
      expect.objectContaining({
        id: 502,
        order_number: 'ORD-502',
      }),
    ]);
    expect(result.sales_orders).toHaveLength(2);
    expect(result.sales_order?.order_number).toBe('ORD-501');
    expect(result.booking.grouped_slots).toHaveLength(3);
  });

  it('should block releasing an open play slot when registered bookings already exist', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const blockedSlot = {
      id: 901,
      seller_id: 77,
      service_id: 11,
      unavailable_date: futureDate,
      end_date: null,
      start_time: '09:00:00',
      end_time: '11:00:00',
      is_full_day: false,
      reason: 'Open Play',
      block_type: 'open_play',
      open_play_event_id: 321,
      status: 'Active',
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null,
      service: null,
    } as any;

    storeUnavailabilityRepository.findOne.mockResolvedValue(blockedSlot);
    bookingRepository.count.mockResolvedValue(1);

    await expect(
      service.releaseBlockedSlot(blockedSlot.id, sellerUser),
    ).rejects.toThrow(
      'Open play cannot be released because registered bookings already exist.',
    );

    const registeredCountQuery = bookingRepository.count.mock.calls[0]?.[0] as
      | {
          where?: {
            status?: { value?: BookingStatusEnum[] };
          };
        }
      | undefined;
    const registeredStatuses = registeredCountQuery?.where?.status?.value ?? [];
    expect(registeredStatuses).toContain(
      BookingStatusEnum.AWAITING_CONFIRMATION,
    );
    expect(registeredStatuses).toContain(BookingStatusEnum.CONFIRMED);
    expect(registeredStatuses).toContain(BookingStatusEnum.IN_PROGRESS);
    expect(registeredStatuses).toContain(BookingStatusEnum.COMPLETED);
    expect(registeredStatuses).not.toContain(BookingStatusEnum.PENDING);

    expect(storeUnavailabilityRepository.save).not.toHaveBeenCalled();
    expect(openPlayEventRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(
      availabilityRealtimeService.publishAvailabilityChanged,
    ).not.toHaveBeenCalled();
  });

  it('should release open play slot when no registered bookings exist', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const blockedSlot = {
      id: 902,
      seller_id: 77,
      service_id: 11,
      unavailable_date: futureDate,
      end_date: null,
      start_time: '09:00:00',
      end_time: '11:00:00',
      is_full_day: false,
      reason: 'Open Play',
      block_type: 'open_play',
      open_play_event_id: 654,
      status: 'Active',
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null,
      service: { title: 'Pickleball Court 1' },
    } as any;
    const updatedSlot = {
      ...blockedSlot,
      status: 'Inactive',
      updated_at: new Date(),
    } as any;

    const openPlayUpdateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    storeUnavailabilityRepository.findOne
      .mockResolvedValueOnce(blockedSlot)
      .mockResolvedValueOnce(updatedSlot);
    bookingRepository.count.mockResolvedValue(0);
    storeUnavailabilityRepository.save.mockResolvedValue(updatedSlot);
    openPlayEventRepository.createQueryBuilder.mockReturnValue(
      openPlayUpdateQueryBuilder as any,
    );

    const result = await service.releaseBlockedSlot(blockedSlot.id, sellerUser);

    expect(storeUnavailabilityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: blockedSlot.id,
        status: 'Inactive',
      }),
    );
    expect(openPlayUpdateQueryBuilder.execute).toHaveBeenCalled();
    expect(
      availabilityRealtimeService.publishAvailabilityChanged,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        change_type: 'open_play_cancelled',
        open_play_event_id: blockedSlot.open_play_event_id,
      }),
    );
    expect(result.status).toBe('Inactive');
  });
});
