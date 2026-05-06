import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';
import {
  AvailabilityChangedPayload,
  PublishAvailabilityChangedPayload,
} from './availability-realtime.types';

const normalizeFeatureFlag = (value?: string): boolean => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return true;
  }

  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

@Injectable()
export class AvailabilityRealtimeService {
  private readonly logger = new Logger(AvailabilityRealtimeService.name);
  private readonly enabled: boolean;
  private server: Server | null = null;

  constructor(private readonly configService: ConfigService) {
    this.enabled = normalizeFeatureFlag(
      this.configService.get<string>('ENABLE_AVAILABILITY_WS'),
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setServer(server: Server): void {
    this.server = server;
  }

  buildServiceRoom(serviceId: number): string {
    return `availability:service:${serviceId}`;
  }

  buildDateRoom(date: string): string {
    return `availability:date:${date}`;
  }

  publishAvailabilityChanged(payload: PublishAvailabilityChangedPayload): void {
    if (!this.enabled) {
      return;
    }

    let normalizedDate: string;
    try {
      normalizedDate = this.normalizeDateOnly(payload.date);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid availability date';
      this.logger.warn(`Skipping availability event: ${message}`);
      return;
    }

    const sellerId = Number(payload.seller_id);
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      this.logger.warn('Skipping availability event: invalid seller_id');
      return;
    }

    const normalizedServiceId = this.normalizeInteger(payload.service_id);
    const normalizedOpenPlayEventId = this.normalizeInteger(
      payload.open_play_event_id,
    );
    const eventPayload: AvailabilityChangedPayload = {
      event_id: payload.event_id?.trim() || randomUUID(),
      occurred_at: this.normalizeOccurredAt(payload.occurred_at),
      change_type: payload.change_type,
      seller_id: sellerId,
      service_id: normalizedServiceId,
      date: normalizedDate,
      start_time: this.normalizeTime(payload.start_time),
      end_time: this.normalizeTime(payload.end_time),
      block_type: this.normalizeBlockType(payload.block_type),
      open_play_event_id: normalizedOpenPlayEventId,
      source: String(payload.source || '').trim() || 'unknown',
    };

    const rooms = this.resolveRooms(eventPayload);
    if (rooms.length === 0) {
      return;
    }

    if (!this.server) {
      this.logger.debug(
        `Availability change queued before socket init (${eventPayload.change_type} on ${eventPayload.date})`,
      );
      return;
    }

    this.server.to(rooms).emit('availability:changed', eventPayload);
  }

  private resolveRooms(payload: AvailabilityChangedPayload): string[] {
    const rooms = new Set<string>([this.buildDateRoom(payload.date)]);
    if (
      typeof payload.service_id === 'number' &&
      Number.isFinite(payload.service_id)
    ) {
      rooms.add(this.buildServiceRoom(payload.service_id));
    }
    return Array.from(rooms);
  }

  private normalizeOccurredAt(value?: string | Date): string {
    const candidate = value ? new Date(value) : new Date();
    if (Number.isFinite(candidate.getTime())) {
      return candidate.toISOString();
    }
    return new Date().toISOString();
  }

  private normalizeDateOnly(value: string): string {
    const raw = String(value || '').trim();
    const normalized = raw.includes('T') ? raw.slice(0, 10) : raw;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new Error(`Invalid availability date value: ${value}`);
    }

    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime())) {
      throw new Error(`Invalid availability date value: ${value}`);
    }

    return normalized;
  }

  private normalizeTime(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }
    return trimmed;
  }

  private normalizeInteger(value?: number | null): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    const normalized = Math.trunc(value);
    return normalized >= 1 ? normalized : null;
  }

  private normalizeBlockType(
    value?: 'maintenance' | 'open_play' | null,
  ): 'maintenance' | 'open_play' | null {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'maintenance') {
      return 'maintenance';
    }
    if (normalized === 'open_play') {
      return 'open_play';
    }
    return null;
  }
}
