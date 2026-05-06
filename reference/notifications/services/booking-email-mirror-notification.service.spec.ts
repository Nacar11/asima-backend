import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEmailMirrorNotificationService } from './booking-email-mirror-notification.service';
import { NotificationsService } from '../notifications.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

describe('BookingEmailMirrorNotificationService', () => {
  let service: BookingEmailMirrorNotificationService;
  let notificationsService: jest.Mocked<NotificationsService>;
  let userGroupRepository: jest.Mocked<Repository<UserGroupEntity>>;
  let userAssignmentRepository: jest.Mocked<Repository<UserAssignmentEntity>>;

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockSellerRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUserGroupRepository = {
    findOne: jest.fn(),
  };

  const mockAssignmentQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockUserAssignmentRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockAssignmentQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingEmailMirrorNotificationService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserGroupEntity),
          useValue: mockUserGroupRepository,
        },
        {
          provide: getRepositoryToken(UserAssignmentEntity),
          useValue: mockUserAssignmentRepository,
        },
      ],
    }).compile();

    service = module.get(BookingEmailMirrorNotificationService);
    notificationsService = module.get(NotificationsService);
    userGroupRepository = module.get(getRepositoryToken(UserGroupEntity));
    userAssignmentRepository = module.get(
      getRepositoryToken(UserAssignmentEntity),
    );
  });

  it('should mirror venue booking submission to customer, seller, and approver recipients', async () => {
    userGroupRepository.findOne.mockResolvedValue({ id: 9 } as UserGroupEntity);
    mockAssignmentQueryBuilder.getMany.mockResolvedValue([{ user: { id: 7 } }]);

    await service.sendVenueBookingSubmittedNotifications({
      id: 101,
      booking_number: 'VB-101',
      customer_id: 10,
      customer: { id: 10, is_guest: false } as UserEntity,
      seller_id: 3,
      seller: { id: 3, user_id: 5, store_name: 'Center Court' } as SellerEntity,
      service: { title: 'Pickleball Court A' } as any,
    } as any);

    expect(notificationsService.create).toHaveBeenCalledTimes(3);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 10,
        type: NotificationTypeEnum.VENUE_BOOKING_SUBMITTED,
        entity_type: 'booking',
        entity_id: 101,
        send_push: true,
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 5,
        type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
        entity_type: 'provider_booking',
        entity_id: 101,
        send_push: true,
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 7,
        type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
        entity_type: 'provider_booking',
        entity_id: 101,
        send_push: true,
      }),
    );
  });

  it('should suppress customer mirror notifications for guest users', async () => {
    userGroupRepository.findOne.mockResolvedValue({ id: 9 } as UserGroupEntity);
    mockAssignmentQueryBuilder.getMany.mockResolvedValue([]);

    await service.sendVenueBookingSubmittedNotifications({
      id: 202,
      booking_number: 'VB-202',
      customer_id: 10,
      customer: { id: 10, is_guest: true } as UserEntity,
      seller_id: 3,
      seller: { id: 3, user_id: 5, store_name: 'Center Court' } as SellerEntity,
      service: { title: 'Pickleball Court A' } as any,
    } as any);

    expect(notificationsService.create).toHaveBeenCalledTimes(1);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 5,
        type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
      }),
    );
  });

  it('should suppress the acting seller from mirrored staff payment notifications', async () => {
    userGroupRepository.findOne.mockResolvedValue({ id: 9 } as UserGroupEntity);
    mockAssignmentQueryBuilder.getMany.mockResolvedValue([
      { user: { id: 7 } },
      { user: { id: 5 } },
    ]);

    await service.sendBookingPaymentEventNotifications({
      eventType: 'confirmed',
      actorUserId: 5,
      booking: {
        id: 303,
        booking_number: 'BK-303',
        customer_id: 10,
        customer: { id: 10, is_guest: false } as UserEntity,
        seller_id: 3,
        seller: {
          id: 3,
          user_id: 5,
          store_name: 'Center Court',
        } as SellerEntity,
        service: { title: 'Service Booking' } as any,
      } as any,
    });

    expect(notificationsService.create).toHaveBeenCalledTimes(2);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 10,
        type: NotificationTypeEnum.BOOKING_PAYMENT_CONFIRMED,
        entity_type: 'booking',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 7,
        type: NotificationTypeEnum.BOOKING_PAYMENT_CONFIRMED,
        entity_type: 'provider_booking',
      }),
    );
    expect(notificationsService.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 5,
        entity_type: 'provider_booking',
      }),
    );
  });

  it('should mirror awaiting-confirmation payment copy close to the email content', async () => {
    userGroupRepository.findOne.mockResolvedValue({ id: 9 } as UserGroupEntity);
    mockAssignmentQueryBuilder.getMany.mockResolvedValue([{ user: { id: 7 } }]);

    await service.sendBookingPaymentEventNotifications({
      eventType: 'awaiting_confirmation',
      booking: {
        id: 404,
        booking_number: 'BK-404',
        customer_id: 10,
        customer: {
          id: 10,
          is_guest: false,
          first_name: 'Anjo',
          last_name: 'Perez',
        } as UserEntity,
        seller_id: 3,
        seller: {
          id: 3,
          user_id: 5,
          store_name: 'Zooooom Carwash',
        } as SellerEntity,
        service: { title: 'Basic Wash' } as any,
      } as any,
    });

    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 10,
        type: NotificationTypeEnum.BOOKING_PAYMENT_AWAITING_CONFIRMATION,
        title: 'Booking Awaiting Payment Confirmation',
        body:
          'We received your payment submission for booking #BK-404 for Basic Wash. Your booking is pending store approval.',
        entity_type: 'booking',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 7,
        type: NotificationTypeEnum.BOOKING_PENDING_CONFIRMATION,
        title: 'Booking Awaiting Payment Confirmation',
        body:
          'Anjo Perez submitted payment proof for booking #BK-404 for Basic Wash. The booking is awaiting confirmation.',
        entity_type: 'provider_booking',
      }),
    );
  });
});
