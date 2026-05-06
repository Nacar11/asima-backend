import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseOrderTrackingEventRepository } from '../base-order-tracking-event.repository';
import { OrderTrackingEventEntity } from '../entities/order-tracking-event.entity';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';
import { OrderTrackingEventMapper } from '../mappers/order-tracking-event.mapper';

/**
 * Concrete implementation of OrderTrackingEvent repository
 */
@Injectable()
export class OrderTrackingEventRepository
  implements BaseOrderTrackingEventRepository
{
  constructor(
    @InjectRepository(OrderTrackingEventEntity)
    private readonly repository: Repository<OrderTrackingEventEntity>,
  ) {}

  /**
   * Create a new order tracking event
   */
  async create(data: OrderTrackingEvent): Promise<OrderTrackingEvent> {
    const persistenceEntity = OrderTrackingEventMapper.toPersistence(data);
    const savedEntity = await this.repository.save(persistenceEntity);

    return OrderTrackingEventMapper.toDomain(savedEntity);
  }

  /**
   * Find order tracking event by ID
   */
  async findById(id: number): Promise<OrderTrackingEvent | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by'],
    });

    if (!entity) {
      return null;
    }

    return OrderTrackingEventMapper.toDomain(entity);
  }

  /**
   * Find all tracking events for an order
   */
  async findByOrderId(orderId: number): Promise<OrderTrackingEvent[]> {
    const entities = await this.repository.find({
      where: { order_id: orderId },
      relations: ['created_by'],
      order: { event_timestamp: 'ASC' },
    });

    return entities.map((entity) => OrderTrackingEventMapper.toDomain(entity));
  }

  /**
   * Find the latest tracking event for an order
   */
  async findLatestByOrderId(
    orderId: number,
  ): Promise<OrderTrackingEvent | null> {
    const entity = await this.repository.findOne({
      where: { order_id: orderId },
      relations: ['created_by'],
      order: { event_timestamp: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return OrderTrackingEventMapper.toDomain(entity);
  }
}
