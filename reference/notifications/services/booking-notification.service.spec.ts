import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingNotificationService } from './booking-notification.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsService } from '../notifications.service';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

describe('BookingNotificationService', () => {
  let service: BookingNotificationService;
  let notificationsService: jest.Mocked<NotificationsService>;
  let userGroupRepository: jest.Mocked<Repository<UserGroupEntity>>;

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockPushNotificationService = {
    sendToUser: jest.fn().mockResolvedValue(1),
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
        BookingNotificationService,
        {
          provide: PushNotificationService,
          useValue: mockPushNotificationService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
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

    service = module.get(BookingNotificationService);
    notificationsService = module.get(NotificationsService);
    userGroupRepository = module.get(getRepositoryToken(UserGroupEntity));
  });

  it('should send customer reschedule notifications to seller and approvers using BOOKING_RESCHEDULED', async () => {
    userGroupRepository.findOne.mockResolvedValue({
      id: 14,
    } as UserGroupEntity);
    mockAssignmentQueryBuilder.getMany.mockResolvedValue([{ user: { id: 8 } }]);

    await service.sendBookingRescheduledNotification({
      id: 11,
      booking_number: 'BK-11',
      seller_id: 3,
      seller: { id: 3, user_id: 5 } as any,
    } as any);

    expect(notificationsService.create).toHaveBeenCalledTimes(2);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 5,
        type: NotificationTypeEnum.BOOKING_RESCHEDULED,
        entity_type: 'provider_booking',
        entity_id: 11,
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 8,
        type: NotificationTypeEnum.BOOKING_RESCHEDULED,
        entity_type: 'provider_booking',
        entity_id: 11,
      }),
    );
  });

  it('should send seller reschedule notifications to the customer', async () => {
    await service.sendBookingRescheduledBySellerNotification({
      id: 22,
      booking_number: 'BK-22',
      customer_id: 9,
    } as any);

    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 9,
        type: NotificationTypeEnum.BOOKING_RESCHEDULED,
        entity_type: 'booking',
        entity_id: 22,
        send_push: true,
      }),
    );
  });

  it('should use the dedicated assigned and updated notification types', async () => {
    await service.sendBookingAssignedNotification({
      id: 30,
      booking_number: 'BK-30',
      customer_id: 90,
    } as any);

    await service.sendBookingUpdatedNotification({
      id: 31,
      booking_number: 'BK-31',
      customer_id: 91,
    } as any);

    expect(notificationsService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        user_id: 90,
        type: NotificationTypeEnum.BOOKING_ASSIGNED,
      }),
    );
    expect(notificationsService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: 91,
        type: NotificationTypeEnum.BOOKING_UPDATED,
      }),
    );
  });

  it('should use QR-specific booking copy for seller booking-created notifications', async () => {
    await service.sendBookingCreatedNotification({
      id: 44,
      seller: { user_id: 5 } as any,
      service: { title: 'Zooooom Carwash' } as any,
      primary_guest: { full_name: 'Anjo' } as any,
      guest_payment_method: 'maya_qr',
    } as any);

    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 5,
        type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
        title: 'Booking Request Submitted',
        body:
          'Anjo submitted a booking request for Zooooom Carwash. Payment is pending - confirm once payment proof is received.',
        entity_type: 'provider_booking',
        entity_id: 44,
        send_push: true,
      }),
    );
  });
});
