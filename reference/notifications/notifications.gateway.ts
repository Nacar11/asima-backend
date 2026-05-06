import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './domain/notification';
import { AllConfigType } from '@/config/config.type';
import { buildWsOriginChecker } from '@/utils/helpers/cors.helper';

/**
 * Notifications WebSocket Gateway.
 *
 * Handles real-time notification delivery via WebSockets (Socket.io).
 * Manages client connections, user rooms, and notification broadcasts.
 *
 * @version 1
 * @since 1.0.0
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      NotificationsGateway.originChecker(origin, callback);
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private static originChecker: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => void =
    (_origin, callback) => callback(null, true);

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers: Map<number, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /**
   * Called after gateway initialization.
   */
  afterInit(): void {
    const corsOrigins =
      this.configService.get('app.corsAllowedOrigins', { infer: true }) ||
      this.configService.get('app.frontendDomain', { infer: true });
    NotificationsGateway.originChecker = buildWsOriginChecker(corsOrigins);

    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  /**
   * Handle new client connection.
   *
   * Authenticates the client using JWT token and joins them to their personal room.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticateClient(client);

      if (!user) {
        this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect(true);
        return;
      }

      // Store user info on socket
      client.data.user = user;
      const userId = user.id;

      // Join user's personal room
      await client.join(`user:${userId}`);

      // Join admin room if user is a system admin
      if (user.system_admin) {
        await client.join('admin');
      }

      // Track connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      this.logger.log(
        `Client connected: ${client.id}, User: ${userId}, ` +
          `Total connections for user: ${this.connectedUsers.get(userId)!.size}`,
      );

      // Send connection confirmation
      client.emit('notification:connected', {
        userId,
        connectedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnection.
   */
  handleDisconnect(client: Socket): void {
    const userId = client.data.user?.id;

    if (userId) {
      const userConnections = this.connectedUsers.get(userId);
      if (userConnections) {
        userConnections.delete(client.id);
        if (userConnections.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      this.logger.log(
        `Client disconnected: ${client.id}, User: ${userId}, ` +
          `Remaining connections: ${this.connectedUsers.get(userId)?.size ?? 0}`,
      );
    } else {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
    }
  }

  /**
   * Authenticate client using JWT token.
   *
   * @param client - Socket client
   * @returns User payload or null if unauthorized
   */
  private async authenticateClient(client: Socket): Promise<any | null> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        return null;
      }

      const secret = this.configService.get('auth.secret', { infer: true });

      if (!secret) {
        this.logger.error('JWT secret not available for token verification');
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, { secret });

      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract JWT token from client handshake.
   *
   * Tries multiple sources: auth object, Authorization header, query parameter.
   */
  private extractToken(client: Socket): string | null {
    // Priority 1: Auth object
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Priority 2: Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Priority 3: Query parameter
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Handle ping message for keep-alive.
   */
  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Check if a user is currently connected.
   *
   * @param userId - User ID to check
   * @returns True if user has at least one active connection
   */
  isUserConnected(userId: number): boolean {
    return (
      this.connectedUsers.has(userId) &&
      this.connectedUsers.get(userId)!.size > 0
    );
  }

  /**
   * Get count of connected users.
   *
   * @returns Number of unique users with active connections
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all connection IDs for a user.
   *
   * @param userId - User ID
   * @returns Array of socket IDs
   */
  getUserConnections(userId: number): string[] {
    return Array.from(this.connectedUsers.get(userId) ?? []);
  }

  /**
   * Get connection statistics.
   *
   * @returns Connection stats object
   */
  getConnectionStats(): {
    totalConnections: number;
    uniqueUsers: number;
    avgConnectionsPerUser: number;
  } {
    let totalConnections = 0;
    this.connectedUsers.forEach((connections) => {
      totalConnections += connections.size;
    });

    const uniqueUsers = this.connectedUsers.size;
    return {
      totalConnections,
      uniqueUsers,
      avgConnectionsPerUser:
        uniqueUsers > 0 ? totalConnections / uniqueUsers : 0,
    };
  }

  /**
   * Send notification to a specific user.
   *
   * @param userId - Target user ID
   * @param notification - Notification to send
   */
  sendToUser(userId: number, notification: Notification): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
    this.logger.debug(`Sent notification to user:${userId}`);
  }

  /**
   * Send notification to all connected admin users.
   *
   * @param notification - Notification to broadcast
   */
  sendToAdmin(notification: Notification): void {
    this.server.to('admin').emit('notification:new', notification);
    this.logger.debug('Sent notification to admin room');
  }

  /**
   * Send unread count update to a specific user.
   *
   * @param userId - Target user ID
   * @param count - Unread notification count
   */
  sendUnreadCount(userId: number, count: number): void {
    this.server.to(`user:${userId}`).emit('notification:count', { count });
  }

  /**
   * Notify user that a notification was marked as read.
   *
   * @param userId - Target user ID
   * @param notificationId - Notification ID
   */
  sendNotificationRead(userId: number, notificationId: number): void {
    this.server.to(`user:${userId}`).emit('notification:read', {
      id: notificationId,
      read_at: new Date().toISOString(),
    });
  }

  /**
   * Notify user that all notifications were marked as read.
   *
   * @param userId - Target user ID
   */
  sendAllNotificationsRead(userId: number): void {
    this.server.to(`user:${userId}`).emit('notification:read_all', {
      read_at: new Date().toISOString(),
    });
  }
}
