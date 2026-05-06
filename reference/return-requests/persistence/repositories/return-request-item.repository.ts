import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnRequestItemEntity } from '../entities/return-request-item.entity';
import { ReturnRequestItem } from '@/return-requests/domain/return-request-item';
import { ReturnRequestItemMapper } from '../mappers/return-request-item.mapper';

@Injectable()
export class ReturnRequestItemRepository {
  constructor(
    @InjectRepository(ReturnRequestItemEntity)
    private readonly repository: Repository<ReturnRequestItemEntity>,
  ) {}

  private readonly defaultRelations = [
    'variant',
    'variant.product',
    'service',
    'service.gallery',
    'service.category',
    'sales_order_item',
    'created_by',
    'updated_by',
  ];

  async create(data: Partial<ReturnRequestItem>): Promise<ReturnRequestItem> {
    const persistenceEntity = ReturnRequestItemMapper.toPersistence(data);
    const savedEntity = await this.repository.save(
      persistenceEntity as ReturnRequestItemEntity,
    );
    return this.findById(savedEntity.id) as Promise<ReturnRequestItem>;
  }

  async createMany(
    items: Partial<ReturnRequestItem>[],
  ): Promise<ReturnRequestItem[]> {
    const persistenceEntities = items.map((item) =>
      ReturnRequestItemMapper.toPersistence(item),
    );
    const savedEntities = await this.repository.save(
      persistenceEntities as ReturnRequestItemEntity[],
    );
    return Promise.all(
      savedEntities.map(
        (entity) => this.findById(entity.id) as Promise<ReturnRequestItem>,
      ),
    );
  }

  async findById(id: number): Promise<ReturnRequestItem | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: this.defaultRelations,
    });

    if (!entity) {
      return null;
    }

    return ReturnRequestItemMapper.toDomain(entity);
  }

  async findByReturnRequestId(
    returnRequestId: number,
  ): Promise<ReturnRequestItem[]> {
    const entities = await this.repository.find({
      where: { return_request_id: returnRequestId },
      relations: this.defaultRelations,
    });

    return entities.map((entity) => ReturnRequestItemMapper.toDomain(entity));
  }

  async update(
    id: number,
    data: Partial<ReturnRequestItem>,
  ): Promise<ReturnRequestItem> {
    await this.repository.update(
      id,
      ReturnRequestItemMapper.toPersistence(data),
    );
    return this.findById(id) as Promise<ReturnRequestItem>;
  }

  async updateByReturnRequestId(
    returnRequestId: number,
    data: Partial<ReturnRequestItem>,
  ): Promise<void> {
    await this.repository.update(
      { return_request_id: returnRequestId },
      ReturnRequestItemMapper.toPersistence(data),
    );
  }
}
