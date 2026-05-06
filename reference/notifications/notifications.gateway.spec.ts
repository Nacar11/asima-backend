import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { Server, Socket } from 'socket.io';
import { Notification } from './domain/notification';
import { NotificationTypeEnum } from './enums/notification-type.enum';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);

    // Mock server
    gateway.server = mockServer as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log gateway initialization', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.afterInit();
      expect(logSpy).toHaveBeenCalledWith(
        'Notifications WebSocket Gateway initialized',
      );
    });
  });

  describe('sendToUser', () => {
    it('should emit notification:new event to user room', () => {
      const notification: Notification = {
        id: 1,
        user_id: 123,
        type: NotificationTypeEnum.BOOKING_CONFIRMED,
        title: 'Test Notification',
        body: 'Test body',
        entity_type: 'booking',
        entity_id: 1,
        action_url: '/bookings/1',
        read_at: null,
        push_sent: false,
        push_sent_at: null,
        status: 'Active',
        created_at: new Date(),
      };

      gateway.sendToUser(123, notification);

      expect(mockServer.to).toHaveBeenCalledWith('user:123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification:new',
        notification,
      );
    });
  });

  describe('sendUnreadCount', () => {
    it('should emit notification:count event to user room', () => {
      gateway.sendUnreadCount(123, 5);

      expect(mockServer.to).toHaveBeenCalledWith('user:123');
      expect(mockServer.emit).toHaveBeenCalledWith('notification:count', {
        count: 5,
      });
    });
  });

  describe('sendNotificationRead', () => {
    it('should emit notification:read event to user room', () => {
      gateway.sendNotificationRead(123, 456);

      expect(mockServer.to).toHaveBeenCalledWith('user:123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification:read',
        expect.objectContaining({
          id: 456,
          read_at: expect.any(String),
        }),
      );
    });
  });

  describe('sendAllNotificationsRead', () => {
    it('should emit notification:read_all event to user room', () => {
      gateway.sendAllNotificationsRead(123);

      expect(mockServer.to).toHaveBeenCalledWith('user:123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification:read_all',
        expect.objectContaining({
          read_at: expect.any(String),
        }),
      );
    });
  });

  describe('isUserConnected', () => {
    it('should return false for non-connected user', () => {
      expect(gateway.isUserConnected(999)).toBe(false);
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return 0 when no users are connected', () => {
      expect(gateway.getConnectedUsersCount()).toBe(0);
    });
  });

  describe('getConnectionStats', () => {
    it('should return stats with zeros when no connections', () => {
      const stats = gateway.getConnectionStats();

      expect(stats).toEqual({
        totalConnections: 0,
        uniqueUsers: 0,
        avgConnectionsPerUser: 0,
      });
    });
  });

  describe('handlePing', () => {
    it('should emit pong event', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handlePing(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'pong',
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('handleConnection', () => {
    it('should authenticate client and join user room', async () => {
      const mockClient = {
        id: 'socket-123',
        data: {},
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
          query: {},
        },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(mockClient.join).toHaveBeenCalledWith('user:1');
      expect(mockClient.emit).toHaveBeenCalledWith(
        'notification:connected',
        expect.objectContaining({
          userId: 1,
          connectedAt: expect.any(String),
        }),
      );
      expect(gateway.isUserConnected(1)).toBe(true);
    });

    it('should disconnect client with invalid token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValueOnce(new Error());

      const mockClient = {
        id: 'socket-456',
        data: {},
        handshake: {
          auth: { token: 'invalid-token' },
          headers: {},
          query: {},
        },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect client without token', async () => {
      const mockClient = {
        id: 'socket-789',
        data: {},
        handshake: {
          auth: {},
          headers: {},
          query: {},
        },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user connection tracking on disconnect', async () => {
      // First connect a user
      const mockClient = {
        id: 'socket-123',
        data: {},
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
          query: {},
        },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);
      expect(gateway.isUserConnected(1)).toBe(true);

      // Then disconnect
      gateway.handleDisconnect(mockClient);
      expect(gateway.isUserConnected(1)).toBe(false);
    });
  });
});
