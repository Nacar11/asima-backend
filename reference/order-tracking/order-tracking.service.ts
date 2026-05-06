import { Injectable } from '@nestjs/common';
import { BaseOrderTrackingEventRepository } from './persistence/base-order-tracking-event.repository';
import { OrderTrackingEvent } from './domain/order-tracking-event';
import { OrderEventTypeEnum } from './domain/event-type.enum';
import { User } from '@/users/domain/user';

/**
 * Order Tracking Service
 * Handles business logic for order tracking events
 */
@Injectable()
export class OrderTrackingService {
  constructor(
    private readonly orderTrackingEventRepository: BaseOrderTrackingEventRepository,
  ) {}

  /**
   * Create a new order tracking event
   * @param orderId Sales order ID
   * @param eventType Type of event
   * @param description Optional description
   * @param user User creating the event
   * @param location Optional location
   * @param latitude Optional GPS latitude
   * @param longitude Optional GPS longitude
   * @param notes Optional additional notes
   * @returns Created order tracking event
   */
  async createEvent(
    orderId: number,
    eventType: OrderEventTypeEnum,
    description?: string,
    user?: User,
    location?: string,
    latitude?: number,
    longitude?: number,
    notes?: string,
  ): Promise<OrderTrackingEvent> {
    const event = new OrderTrackingEvent();
    event.order_id = orderId;
    event.event_type = eventType;
    event.description = description;
    event.notes = notes;
    event.location = location;
    event.latitude = latitude;
    event.longitude = longitude;
    event.event_timestamp = new Date();

    if (user) {
      event.created_by = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      };
    }

    return this.orderTrackingEventRepository.create(event);
  }

  /**
   * Get all tracking events for an order
   * @param orderId Sales order ID
   * @returns Array of order tracking events sorted by timestamp
   */
  async getEventsByOrderId(orderId: number): Promise<OrderTrackingEvent[]> {
    return this.orderTrackingEventRepository.findByOrderId(orderId);
  }

  /**
   * Get the latest tracking event for an order
   * @param orderId Sales order ID
   * @returns Latest order tracking event or null
   */
  async getLatestEventByOrderId(
    orderId: number,
  ): Promise<OrderTrackingEvent | null> {
    return this.orderTrackingEventRepository.findLatestByOrderId(orderId);
  }

  /**
   * Get event by ID
   * @param id Event ID
   * @returns Order tracking event or null
   */
  async getEventById(id: number): Promise<OrderTrackingEvent | null> {
    return this.orderTrackingEventRepository.findById(id);
  }
}
