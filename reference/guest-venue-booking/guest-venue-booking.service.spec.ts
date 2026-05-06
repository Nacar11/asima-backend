import { GuestVenueBookingService } from './guest-venue-booking.service';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';

const buildEdistrictRepository = () => ({
  findOne: jest.fn().mockImplementation(({ where }: { where?: any }) => {
    if (where?.key !== 'tambayan-district') {
      return Promise.resolve(null);
    }

    if (where?.status === 'active') {
      return Promise.resolve({
        id: 1,
        seller_id: 5,
      });
    }

    return Promise.resolve({
      id: 1,
      status: 'active',
    });
  }),
});

const buildService = (frontendDomain = 'http://localhost:3000/') => {
  const openPlaySkillLevelRepository = {
    findOne: jest.fn().mockResolvedValue({
      code: 'all_levels',
      is_active: true,
    }),
  };
  const edistrictRepository = buildEdistrictRepository();
  const deps: ConstructorParameters<typeof GuestVenueBookingService> = [
    {
      get: jest.fn((key: string) => {
        if (key === 'DEFAULT_TIMEZONE') {
          return 'Asia/Manila';
        }
        if (key === 'FRONTEND_DOMAIN') {
          return frontendDomain;
        }
        return undefined;
      }),
    } as any,
    {} as any, // servicesService
    {} as any, // sellerSchedulesService
    {} as any, // usersService
    {} as any, // salesOrderRepository
    {} as any, // salesOrderItemRepository
    {} as any, // paymentOrderRepository
    {} as any, // checkoutPaymentRepository
    {} as any, // bookingEntityRepository
    {
      find: jest.fn().mockResolvedValue([]),
      manager: {
        getRepository: jest.fn().mockReturnValue(openPlaySkillLevelRepository),
      },
    } as any, // openPlayEventRepository
    {} as any, // storeUnavailabilityRepository
    {} as any, // userGroupRepository
    {} as any, // userAssignmentRepository
    {} as any, // bookingsService
    {} as any, // bookingRepository
    {} as any, // checkoutPaymentsService
    {} as any, // serviceAddonsService
    {} as any, // salesOrderItemAddonRepository
    {} as any, // sellersService
    {} as any, // storageService
    {} as any, // mailService
    {} as any, // bookingEmailMirrorNotificationService
    {} as any, // bookingGuestRepository
    {} as any, // guestVenueBookingExpirySchedulerService
    {} as any, // availabilityRealtimeService
    {} as any, // vouchersService
    {} as any, // salesOrderVoucherRepository
    {} as any, // customPaymentMethodRepository
    edistrictRepository as any,
    {
      findOne: jest.fn().mockResolvedValue(null),
    } as any, // sellerPaymentProfileRepository
    {
      resolveSellerIdForVisibleLocationKey: jest.fn().mockResolvedValue(null),
      findAnyIndependentLocationByKey: jest.fn().mockResolvedValue(null),
    } as any, // pickleballLocationsService
  ];

  return new GuestVenueBookingService(...deps);
};

const buildServiceWithMocks = ({
  frontendDomain = 'http://localhost:3000/',
  servicesService = {},
  bookingRepository = {},
  sellersService = {},
  availabilityRealtimeService = {
    publishAvailabilityChanged: jest.fn(),
  },
  openPlaySkillLevelRepository = {
    findOne: jest.fn().mockResolvedValue({
      code: 'all_levels',
      is_active: true,
    }),
  },
  openPlayEventRepository = {
    find: jest.fn().mockResolvedValue([]),
    manager: {
      getRepository: jest.fn().mockReturnValue(openPlaySkillLevelRepository),
    },
  },
  vouchersService = {},
  salesOrderVoucherRepository = {},
  customPaymentMethodRepository = {},
  edistrictRepository = buildEdistrictRepository(),
  sellerPaymentProfileRepository = {
    findOne: jest.fn().mockResolvedValue(null),
  },
  pickleballLocationsService = {
    resolveSellerIdForVisibleLocationKey: jest.fn().mockResolvedValue(null),
    findAnyIndependentLocationByKey: jest.fn().mockResolvedValue(null),
  },
}: {
  frontendDomain?: string;
  servicesService?: any;
  bookingRepository?: any;
  sellersService?: any;
  availabilityRealtimeService?: any;
  openPlaySkillLevelRepository?: any;
  openPlayEventRepository?: any;
  vouchersService?: any;
  salesOrderVoucherRepository?: any;
  customPaymentMethodRepository?: any;
  sellerPaymentProfileRepository?: any;
  pickleballLocationsService?: any;
  edistrictRepository?: any;
}) => {
  const deps: ConstructorParameters<typeof GuestVenueBookingService> = [
    {
      get: jest.fn((key: string) => {
        if (key === 'DEFAULT_TIMEZONE') {
          return 'Asia/Manila';
        }
        if (key === 'FRONTEND_DOMAIN') {
          return frontendDomain;
        }
        return undefined;
      }),
    } as any,
    servicesService as any,
    {} as any, // sellerSchedulesService
    {} as any, // usersService
    {} as any, // salesOrderRepository
    {} as any, // salesOrderItemRepository
    {} as any, // paymentOrderRepository
    {} as any, // checkoutPaymentRepository
    {} as any, // bookingEntityRepository
    openPlayEventRepository as any,
    {} as any, // storeUnavailabilityRepository
    {} as any, // userGroupRepository
    {} as any, // userAssignmentRepository
    {} as any, // bookingsService
    bookingRepository as any,
    {} as any, // checkoutPaymentsService
    {} as any, // serviceAddonsService
    {} as any, // salesOrderItemAddonRepository
    sellersService as any,
    {} as any, // storageService
    {} as any, // mailService
    {} as any, // bookingEmailMirrorNotificationService
    {} as any, // bookingGuestRepository
    {} as any, // guestVenueBookingExpirySchedulerService
    availabilityRealtimeService as any,
    vouchersService as any,
    salesOrderVoucherRepository as any,
    customPaymentMethodRepository as any,
    edistrictRepository as any,
    sellerPaymentProfileRepository as any,
    pickleballLocationsService as any,
  ];

  return new GuestVenueBookingService(...deps);
};

describe('GuestVenueBookingService', () => {
  it('normalizes supported guest payment methods', () => {
    const service = buildService();

    expect(
      (service as any).resolveGuestPaymentMethod([{ payment_method: 'gcash' }]),
    ).toBe('gcash');
    expect(
      (service as any).resolveGuestPaymentMethod([
        { payment_method: 'paymaya_direct' },
      ]),
    ).toBe('paymaya_direct');
    expect(
      (service as any).resolveGuestPaymentMethod([
        { payment_method: 'union_bank' },
      ]),
    ).toBe('unionbank');
  });

  it('rejects mixed guest payment methods in one payment request', () => {
    const service = buildService();

    expect(() =>
      (service as any).resolveGuestPaymentMethod([
        { payment_method: 'gcash' },
        { payment_method: 'unionbank' },
      ]),
    ).toThrow('All bookings in one payment must use the same payment_method.');
  });

  it('allows one checkout request to include multiple scheduled dates', () => {
    const service = buildService();

    expect(() =>
      (service as any).validateVenueBookingBatchSelections([
        {
          service_id: 1,
          scheduled_date: '2026-03-31',
          scheduled_start_time: '08:00:00',
          scheduled_end_time: '09:00:00',
        },
        {
          service_id: 1,
          scheduled_date: '2026-04-01',
          scheduled_start_time: '09:00:00',
          scheduled_end_time: '10:00:00',
        },
      ]),
    ).not.toThrow();
  });

  it('builds the shared guest payment page url', () => {
    const service = buildService('http://localhost:3000/');

    expect(
      (service as any).buildGuestPaymentPageUrl(
        'BK-20260310-1001',
        'Guest@Email.COM',
      ),
    ).toBe(
      'http://localhost:3000/en/pickleball-selection/payment/BK-20260310-1001?email=guest%40email.com',
    );
  });

  it('builds customer email action url to guest payment page', () => {
    const service = buildService();

    expect(
      (service as any).buildGuestBookingPaymentActionUrl(
        'BKG-20260310-1001',
        'Guest@Email.COM',
      ),
    ).toBe(
      '/en/pickleball-selection/payment/BKG-20260310-1001?email=guest%40email.com',
    );
  });

  it('falls back to pickleball selection when customer email is missing', () => {
    const service = buildService();

    expect(
      (service as any).buildGuestBookingPaymentActionUrl(
        'BKG-20260310-1001',
        null,
      ),
    ).toBe('/pickleball-selection');
  });

  it('maps manual guest payment gateways by payment method', () => {
    const service = buildService();

    expect((service as any).resolveGuestManualPaymentGateway('gcash')).toBe(
      'manual_gcash',
    );
    expect(
      (service as any).resolveGuestManualPaymentGateway('paymaya_direct'),
    ).toBe('manual_maya');
    expect((service as any).resolveGuestManualPaymentGateway('unionbank')).toBe(
      'manual_unionbank',
    );
  });

  it('should prefer the seller-specific gcash QR over the platform fallback', async () => {
    const sellerPaymentProfileRepository = {
      findOne: jest.fn().mockResolvedValue({
        gcash_qr_image_url: 'media/merchant-gcash.png',
        gcash_display_name: 'Merchant GCash',
      }),
    };
    const customPaymentMethodRepository = {
      findByCode: jest.fn(),
      findById: jest.fn(),
    };
    const service = buildServiceWithMocks({
      sellerPaymentProfileRepository,
      customPaymentMethodRepository,
    });

    await expect(
      (service as any).resolveQrPaymentPresentation('gcash', 88),
    ).resolves.toEqual({
      qr_image_url: `${
        process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002'
      }/media/merchant-gcash.png`,
      label: 'Merchant GCash',
    });

    expect(sellerPaymentProfileRepository.findOne).toHaveBeenCalledWith({
      where: { seller_id: 88, deleted_at: expect.any(Object) },
    });
    expect(customPaymentMethodRepository.findByCode).not.toHaveBeenCalled();
  });

  it('should fall back to the platform QR configuration when the seller has no gcash profile', async () => {
    const sellerPaymentProfileRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const customPaymentMethodRepository = {
      findByCode: jest.fn().mockResolvedValue({
        qr_image_url: 'media/platform-gcash.png',
        name: 'Platform GCash',
      }),
      findById: jest.fn(),
    };
    const service = buildServiceWithMocks({
      sellerPaymentProfileRepository,
      customPaymentMethodRepository,
    });

    await expect(
      (service as any).resolveQrPaymentPresentation('gcash', 88),
    ).resolves.toEqual({
      qr_image_url: 'media/platform-gcash.png',
      label: 'Platform GCash',
    });

    expect(customPaymentMethodRepository.findByCode).toHaveBeenCalledWith(
      'gcash',
    );
  });

  it('keeps blocked slot unavailable even when remaining capacity is positive', async () => {
    const servicesService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        seller_id: 4,
        status: ServiceStatusEnum.ACTIVE,
        service_type: ServiceTypeEnum.VENUE,
        venue_capacity: 1,
        slot_duration_minutes: 60,
      }),
      getVenueAvailableSlots: jest.fn().mockResolvedValue([
        {
          start_time: '21:00:00',
          end_time: '22:00:00',
          available: false,
          remaining: 1,
          unavailable_reason: 'Private event',
          unavailable_source: 'blocked',
        },
      ]),
    };
    const bookingRepository = {
      findBySellerAndDate: jest.fn().mockResolvedValue([]),
    };
    const service = buildServiceWithMocks({
      servicesService,
      bookingRepository,
    });

    const result = await service.getVenueAvailability(1, '2026-03-11');

    expect(result.slots[0]).toMatchObject({
      start_time: '21:00:00',
      end_time: '22:00:00',
      is_available: false,
      available_units: 0,
      unavailable_reason: 'Private event',
      unavailable_source: 'blocked',
    });
  });

  it('maps blocked slot as unavailable in public date-range venues response', async () => {
    const servicesService = {
      findAll: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            seller_id: 4,
            title: 'Court 1',
            base_price: 500,
            hourly_rate: 500,
            venue_capacity: 1,
            slot_duration_minutes: 60,
          },
        ],
        totalCount: 1,
      }),
      getVenueAvailableSlots: jest.fn().mockResolvedValue([
        {
          start_time: '21:00:00',
          end_time: '22:00:00',
          available: false,
          remaining: 1,
          hourly_rate: 500,
          unavailable_reason: 'Private event',
          unavailable_source: 'blocked',
        },
      ]),
    };
    const bookingRepository = {
      findBySellerAndDate: jest.fn().mockResolvedValue([]),
    };
    const service = buildServiceWithMocks({
      servicesService,
      bookingRepository,
    });

    const result = await service.getVenueAvailabilityByDateRange({
      date: '2026-03-11',
    });

    expect(result.venues).toBeDefined();
    expect(result.venues?.[0].slots[0]).toMatchObject({
      start_time: '21:00:00',
      end_time: '22:00:00',
      is_available: false,
      available_units: 0,
      unavailable_reason: 'Private event',
      unavailable_source: 'blocked',
    });
  });

  it('filters public venue slots by Tambayan location', async () => {
    const servicesService = {
      findAll: jest.fn().mockResolvedValue({
        data: [
          {
            id: 8,
            seller_id: 5,
            title: 'Pickleball Court 1',
            base_price: 500,
            hourly_rate: 500,
            venue_capacity: 1,
            slot_duration_minutes: 60,
          },
        ],
        totalCount: 1,
      }),
      getVenueAvailableSlots: jest.fn().mockResolvedValue([
        {
          start_time: '08:00:00',
          end_time: '09:00:00',
          available: true,
          remaining: 1,
          hourly_rate: 500,
        },
      ]),
    };
    const bookingRepository = {
      findBySellerAndDate: jest.fn().mockResolvedValue([]),
    };
    const edistrictRepository = buildEdistrictRepository();
    const service = buildServiceWithMocks({
      servicesService,
      bookingRepository,
      edistrictRepository,
    });

    const result = await service.getVenueAvailabilityByDateRange({
      date: '2026-03-17',
      location: 'tambayan-district',
    });

    expect(edistrictRepository.findOne).toHaveBeenCalledWith({
      where: {
        key: 'tambayan-district',
        status: 'active',
        deleted_at: expect.any(Object),
      },
      select: ['id', 'seller_id'],
    });
    expect(servicesService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        seller_id: 5,
        service_type: ServiceTypeEnum.VENUE,
        status: ServiceStatusEnum.ACTIVE,
      }),
    );
    expect(result.venues?.[0].service_id).toBe(8);
  });

  it('rejects unsupported public venue locations', async () => {
    const edistrictRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = buildServiceWithMocks({ edistrictRepository });

    await expect(
      service.getVenueAvailabilityByDateRange({
        date: '2026-03-17',
        location: 'unknown-venue',
      }),
    ).rejects.toThrow(
      'Invalid location: "unknown-venue" is not a recognized location.',
    );
  });

  it('lists only active open-play events that block slots for the requested public day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-20T08:00:00.000Z'));

    const servicesService = {
      findAll: jest.fn().mockResolvedValue({
        data: [
          {
            id: 8,
            seller_id: 5,
            title: 'FPB Sports Complex',
            base_price: 120,
            hourly_rate: 120,
            venue_capacity: 6,
            slot_duration_minutes: 60,
          },
        ],
        totalCount: 1,
      }),
    };
    const edistrictRepository = buildEdistrictRepository();
    const service = buildServiceWithMocks({
      servicesService,
      edistrictRepository,
    });

    const eventDate = '2026-03-26';
    const createdAt = new Date('2026-03-01T08:00:00.000Z');
    const updatedAt = new Date('2026-03-10T08:00:00.000Z');
    jest
      .spyOn(service as any, 'getActiveOpenPlayEventsForDate')
      .mockResolvedValue([
        {
          id: 101,
          seller_id: 5,
          service_id: 8,
          event_date: eventDate,
          start_time: '16:00:00',
          end_time: '18:00:00',
          title: 'FPB Evening Unli Play',
          description: 'Games, open plays, and new clubs.',
          rate_per_person: 120,
          max_applicants: 16,
          status: 'Published',
          registration_start_at: null,
          registration_end_at: null,
          store_unavailability_id: 901,
          created_at: createdAt,
          updated_at: updatedAt,
          service: null,
        },
      ]);
    jest
      .spyOn(service as any, 'getOpenPlayRegisteredCounts')
      .mockResolvedValue(new Map([[101, 6]]));

    try {
      const result = await service.getPublicOpenPlayEvents({
        date: eventDate,
        location: 'tambayan-district',
      });

      expect(edistrictRepository.findOne).toHaveBeenCalledWith({
        where: {
          key: 'tambayan-district',
          status: 'active',
          deleted_at: expect.any(Object),
        },
        select: ['id', 'seller_id'],
      });
      expect(result.date).toBe(eventDate);
      expect(result.total_count).toBe(1);
      expect(result.events[0]).toMatchObject({
        id: 101,
        service_id: 8,
        title: 'FPB Evening Unli Play',
        remaining_slots: 10,
        venue_name: 'FPB Sports Complex',
        service_title: 'FPB Sports Complex',
        is_registration_open: true,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps open-play registration open inside the final hour before event start', () => {
    const service = buildServiceWithMocks({});
    const event = {
      status: 'Published',
      event_date: '2026-03-27',
      start_time: '16:00:00',
      end_time: '18:00:00',
      registration_start_at: null,
      registration_end_at: null,
    };

    const thirtyMinutesBeforeStart = new Date('2026-03-27T07:30:00.000Z');
    expect(
      (service as any).isOpenPlayRegistrationOpen(
        event,
        5,
        thirtyMinutesBeforeStart,
      ),
    ).toBe(true);
  });

  it('closes open-play registration when the event start time is reached', () => {
    const service = buildServiceWithMocks({});
    const event = {
      status: 'Published',
      event_date: '2026-03-27',
      start_time: '16:00:00',
      end_time: '18:00:00',
      registration_start_at: null,
      registration_end_at: null,
    };

    const eventStartTime = new Date('2026-03-27T08:00:00.000Z');
    expect(
      (service as any).isOpenPlayRegistrationOpen(event, 5, eventStartTime),
    ).toBe(false);
  });

  it('returns empty public open-play list when location seller cannot be resolved', async () => {
    const servicesService = {
      findAll: jest.fn(),
    };
    const edistrictRepository = {
      findOne: jest.fn().mockImplementation(({ where }: { where?: any }) => {
        if (where?.key !== 'tambayan-district') {
          return Promise.resolve(null);
        }

        if (where?.status === 'active') {
          return Promise.resolve({
            id: 1,
            seller_id: null,
          });
        }

        return Promise.resolve({
          id: 1,
          status: 'active',
        });
      }),
    };
    const service = buildServiceWithMocks({
      servicesService,
      edistrictRepository,
    });

    const result = await service.getPublicOpenPlayEvents({
      date: '2026-03-26',
      location: 'tambayan-district',
    });

    expect(edistrictRepository.findOne).toHaveBeenCalledWith({
      where: {
        key: 'tambayan-district',
        status: 'active',
        deleted_at: expect.any(Object),
      },
      select: ['id', 'seller_id'],
    });
    expect(servicesService.findAll).not.toHaveBeenCalled();
    expect(result).toEqual({
      date: '2026-03-26',
      total_count: 0,
      events: [],
    });
  });

  it('lists open-play events with default date range (today to today+30 days)', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-27T08:00:00.000Z'));

    try {
      const mockedEvents = [
        {
          id: 501,
          seller_id: 5,
          service_id: 8,
          event_date: '2026-03-27',
          start_time: '09:00:00',
          end_time: '11:00:00',
          title: 'Morning Open Play',
          description: null,
          rate_per_person: 120,
          max_applicants: 16,
          status: 'Published',
          registration_start_at: null,
          registration_end_at: null,
          store_unavailability_id: 901,
          created_at: new Date('2026-03-01T08:00:00.000Z'),
          updated_at: new Date('2026-03-10T08:00:00.000Z'),
          service: {
            id: 8,
            title: 'Tambayan District Court 1',
          },
        },
      ];

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockedEvents, 1]),
      };

      const openPlayEventRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      };
      const edistrictRepository = buildEdistrictRepository();

      const service = buildServiceWithMocks({
        openPlayEventRepository,
        edistrictRepository,
      });

      jest
        .spyOn(service as any, 'getOpenPlayRegisteredCounts')
        .mockResolvedValue(new Map([[501, 2]]));

      const result = await service.getPublicOpenPlayEventsList({
        location: 'tambayan-district',
      } as any);

      expect(edistrictRepository.findOne).toHaveBeenCalledWith({
        where: {
          key: 'tambayan-district',
          status: 'active',
          deleted_at: expect.any(Object),
        },
        select: ['id', 'seller_id'],
      });
      expect(openPlayEventRepository.createQueryBuilder).toHaveBeenCalledWith(
        'event',
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'event.event_date >= :dateFrom',
        {
          dateFrom: '2026-03-27',
        },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('event.event_date <= :dateTo', {
        dateTo: '2026-04-26',
      });
      expect(result.date_from).toBe('2026-03-27');
      expect(result.date_to).toBe('2026-04-26');
      expect(result.totalCount).toBe(1);
      expect(result.data[0]).toMatchObject({
        id: 501,
        registered_count: 2,
        remaining_slots: 14,
        service_title: 'Tambayan District Court 1',
        venue_name: 'Tambayan District Court 1',
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns empty list for unresolved location seller in open-play list endpoint', async () => {
    const openPlayEventRepository = {
      createQueryBuilder: jest.fn(),
    };
    const edistrictRepository = {
      findOne: jest.fn().mockImplementation(({ where }: { where?: any }) => {
        if (where?.key !== 'tambayan-district') {
          return Promise.resolve(null);
        }

        if (where?.status === 'active') {
          return Promise.resolve({
            id: 1,
            seller_id: null,
          });
        }

        return Promise.resolve({
          id: 1,
          status: 'active',
        });
      }),
    };

    const service = buildServiceWithMocks({
      openPlayEventRepository,
      edistrictRepository,
    });

    const result = await service.getPublicOpenPlayEventsList({
      location: 'tambayan-district',
      date_from: '2026-03-27',
      date_to: '2026-04-26',
    } as any);

    expect(result).toEqual({
      date_from: '2026-03-27',
      date_to: '2026-04-26',
      data: [],
      totalCount: 0,
      skip: 0,
      take: 20,
    });
    expect(openPlayEventRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('applies skill level filtering and returns skill level metadata in open-play list responses', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 702,
            seller_id: 5,
            service_id: 8,
            event_date: '2026-04-02',
            start_time: '18:00:00',
            end_time: '20:00:00',
            title: 'Intermediate Ladder Play',
            description: null,
            rate_per_person: 180,
            max_applicants: 12,
            skill_level_code: 'intermediate',
            status: 'Published',
            registration_start_at: null,
            registration_end_at: null,
            store_unavailability_id: 910,
            created_at: new Date('2026-03-01T08:00:00.000Z'),
            updated_at: new Date('2026-03-01T08:00:00.000Z'),
            service: {
              id: 8,
              title: 'Tambayan District Court 1',
            },
          },
        ],
        1,
      ]),
    };
    const openPlaySkillLevelRepository = {
      findOne: jest.fn().mockResolvedValue({
        code: 'intermediate',
        is_active: true,
      }),
    };
    const openPlayEventRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      manager: {
        getRepository: jest.fn().mockReturnValue(openPlaySkillLevelRepository),
      },
    };
    const edistrictRepository = buildEdistrictRepository();
    const service = buildServiceWithMocks({
      openPlayEventRepository,
      openPlaySkillLevelRepository,
      edistrictRepository,
    });

    jest
      .spyOn(service as any, 'getOpenPlayRegisteredCounts')
      .mockResolvedValue(new Map([[702, 4]]));

    const result = await service.getPublicOpenPlayEventsList({
      location: 'tambayan-district',
      date_from: '2026-04-01',
      date_to: '2026-04-30',
      skill_level_code: 'intermediate',
    } as any);

    expect(openPlaySkillLevelRepository.findOne).toHaveBeenCalledWith({
      where: { code: 'intermediate', is_active: true },
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'event.skill_level_code = :skillLevelCode',
      {
        skillLevelCode: 'intermediate',
      },
    );
    expect(result.data[0]).toMatchObject({
      id: 702,
      skill_level_code: 'intermediate',
      skill_level_label: 'Intermediate',
      registered_count: 4,
      remaining_slots: 8,
    });
  });

  it('expands weekly recurrence using range_start_date weekday when weekly_days is empty', () => {
    const service = buildServiceWithMocks({});

    const dates = (service as any).expandRecurringOpenPlayDates({
      rangeStartDate: '2026-03-31',
      rangeEndDate: '2026-04-14',
      recurrenceType: 'weekly',
      weeklyDays: [],
      monthlyDay: null,
    });

    expect(dates).toEqual(['2026-03-31', '2026-04-07', '2026-04-14']);
  });

  it('expands monthly recurrence and skips non-existing calendar dates', () => {
    const service = buildServiceWithMocks({});

    const dates = (service as any).expandRecurringOpenPlayDates({
      rangeStartDate: '2026-01-30',
      rangeEndDate: '2026-03-31',
      recurrenceType: 'monthly',
      weeklyDays: [],
      monthlyDay: 30,
    });

    expect(dates).toEqual(['2026-01-30', '2026-03-30']);
  });

  it('creates recurring open play with partial success when some occurrences conflict', async () => {
    const availabilityRealtimeService = {
      publishAvailabilityChanged: jest.fn(),
    };
    const servicesService = {
      findById: jest.fn().mockResolvedValue({
        id: 2,
        seller_id: 9,
        status: ServiceStatusEnum.ACTIVE,
        service_type: ServiceTypeEnum.VENUE,
      }),
    };
    const service = buildServiceWithMocks({
      servicesService,
      availabilityRealtimeService,
    });

    jest.spyOn(service as any, 'ensureMinimumLeadTime').mockImplementation();
    jest
      .spyOn(service as any, 'findOpenPlayWindowConflict')
      .mockImplementation(({ eventDate }: { eventDate: string }) =>
        Promise.resolve(
          eventDate === '2026-04-02'
            ? {
                code: 'overlap_block',
                message: 'Selected schedule is already blocked.',
              }
            : null,
        ),
      );
    jest
      .spyOn(service as any, 'createOpenPlayEventWithLinkedBlock')
      .mockImplementation(
        ({ eventDate }: { eventDate: string }) =>
          Promise.resolve({
            id: eventDate === '2026-04-01' ? 1001 : 1003,
            seller_id: 9,
            service_id: 2,
            event_date: eventDate,
            start_time: '17:00:00',
            end_time: '19:00:00',
            store_unavailability_id: eventDate === '2026-04-01' ? 7001 : 7003,
          }) as any,
      );

    const result = await service.createRecurringOpenPlayEvents(
      {
        service_id: 2,
        range_start_date: '2026-04-01',
        range_end_date: '2026-04-03',
        recurrence_type: 'daily',
        start_time: '17:00:00',
        end_time: '19:00:00',
        title: 'Open Play',
        description: 'Evening sessions',
        rate_per_person: 300,
        max_applicants: 16,
        skill_level_code: 'all_levels',
        status: 'Published',
      } as any,
      {
        id: 99,
        seller_id: 9,
        system_admin: false,
      } as any,
    );

    expect(result.summary).toEqual({
      generated: 3,
      created: 2,
      failed: 1,
    });
    expect(result.created).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({
      event_date: '2026-04-02',
      code: 'overlap_block',
    });
    expect(
      availabilityRealtimeService.publishAvailabilityChanged,
    ).toHaveBeenCalledTimes(2);
  });
});
