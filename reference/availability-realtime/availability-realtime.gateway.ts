import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { AllConfigType } from '@/config/config.type';
import { buildWsOriginChecker } from '@/utils/helpers/cors.helper';
import { AvailabilityRealtimeService } from './availability-realtime.service';
import { AvailabilitySubscribePayload } from './availability-realtime.types';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      AvailabilityRealtimeGateway.originChecker(origin, callback);
    },
    credentials: true,
  },
  namespace: '/availability',
})
export class AvailabilityRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private static originChecker: (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => void = (_origin, callback) => callback(null, true);

  private readonly logger = new Logger(AvailabilityRealtimeGateway.name);
  private readonly maxDateRangeDays = 35;
  private readonly maxServicesPerSubscription = 100;

  constructor(
    private readonly availabilityRealtimeService: AvailabilityRealtimeService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  afterInit(): void {
    const corsOrigins =
      this.configService.get('app.corsAllowedOrigins', { infer: true }) ||
      this.configService.get('app.frontendDomain', { infer: true });
    AvailabilityRealtimeGateway.originChecker =
      buildWsOriginChecker(corsOrigins);

    this.availabilityRealtimeService.setServer(this.server);
    this.logger.log('Availability WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    if (!this.availabilityRealtimeService.isEnabled()) {
      client.emit('availability:error', {
        message: 'Availability realtime is disabled.',
      });
      client.disconnect(true);
      return;
    }

    client.data.availabilityRooms = [];
    client.emit('availability:connected', {
      connected_at: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket): void {
    const subscribedRooms = this.getSocketRooms(client);
    this.logger.debug(
      `Availability socket disconnected: ${client.id}, rooms=${subscribedRooms.length}`,
    );
  }

  @SubscribeMessage('availability:subscribe')
  async handleSubscribe(
    client: Socket,
    payload: AvailabilitySubscribePayload,
  ): Promise<void> {
    if (!this.availabilityRealtimeService.isEnabled()) {
      client.emit('availability:error', {
        message: 'Availability realtime is disabled.',
      });
      return;
    }

    const subscription = this.parseSubscription(payload);
    if (!subscription) {
      client.emit('availability:error', {
        message:
          'Invalid subscription payload. Expected start_date, end_date, and optional service_ids.',
      });
      return;
    }

    await this.replaceSubscribedRooms(client, subscription.rooms);

    client.emit('availability:subscribed', {
      start_date: subscription.startDate,
      end_date: subscription.endDate,
      service_ids: subscription.serviceIds,
      room_count: subscription.rooms.length,
      subscribed_at: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  private getSocketRooms(client: Socket): string[] {
    if (!Array.isArray(client.data.availabilityRooms)) {
      return [];
    }
    return client.data.availabilityRooms as string[];
  }

  private async replaceSubscribedRooms(
    client: Socket,
    nextRooms: string[],
  ): Promise<void> {
    const previousRooms = this.getSocketRooms(client);

    if (previousRooms.length > 0) {
      await Promise.all(previousRooms.map((room) => client.leave(room)));
    }

    if (nextRooms.length > 0) {
      await client.join(nextRooms);
    }

    client.data.availabilityRooms = nextRooms;
  }

  private parseSubscription(payload: AvailabilitySubscribePayload): {
    startDate: string;
    endDate: string;
    rooms: string[];
    serviceIds: number[];
  } | null {
    const startDate = this.normalizeDateOnly(payload?.start_date);
    const endDate = this.normalizeDateOnly(payload?.end_date);

    if (!startDate || !endDate) {
      return null;
    }

    const dates = this.expandDateRange(startDate, endDate);
    if (!dates || dates.length === 0 || dates.length > this.maxDateRangeDays) {
      return null;
    }

    const serviceIds = this.normalizeServiceIds(payload?.service_ids);
    const rooms = new Set<string>();
    dates.forEach((date) =>
      rooms.add(this.availabilityRealtimeService.buildDateRoom(date)),
    );
    serviceIds.forEach((serviceId) =>
      rooms.add(this.availabilityRealtimeService.buildServiceRoom(serviceId)),
    );

    return {
      startDate,
      endDate,
      rooms: Array.from(rooms),
      serviceIds,
    };
  }

  private normalizeDateOnly(value?: string): string | null {
    const raw = String(value || '').trim();
    const normalized = raw.includes('T') ? raw.slice(0, 10) : raw;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return null;
    }

    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime())) {
      return null;
    }
    if (parsed.toISOString().slice(0, 10) !== normalized) {
      return null;
    }

    return normalized;
  }

  private expandDateRange(startDate: string, endDate: string): string[] | null {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return null;
    }
    if (end < start) {
      return null;
    }

    const dates: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
  }

  private normalizeServiceIds(input?: number[]): number[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const unique = Array.from(
      new Set(
        input
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );

    return unique.slice(0, this.maxServicesPerSubscription);
  }
}
