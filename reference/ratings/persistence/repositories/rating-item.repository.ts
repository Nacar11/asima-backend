import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRatingItemRepository } from '@/ratings/persistence/base-rating-item.repository';
import { RatingItemEntity } from '@/ratings/persistence/entities/rating-item.entity';
import { RatingItemMapper } from '@/ratings/persistence/mappers/rating-item.mapper';
import { RatingItem } from '@/ratings/domain/rating-item';

@Injectable()
export class RatingItemRepository implements BaseRatingItemRepository {
  constructor(
    @InjectRepository(RatingItemEntity)
    private readonly repository: Repository<RatingItemEntity>,
  ) {}

  async create(
    data: Omit<RatingItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<RatingItem> {
    const entity = this.repository.create(RatingItemMapper.toEntity(data));
    const saved = await this.repository.save(entity);
    return RatingItemMapper.toDomain(saved);
  }

  async createMany(
    data: Omit<RatingItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[],
  ): Promise<RatingItem[]> {
    const entities = data.map((item) =>
      this.repository.create(RatingItemMapper.toEntity(item)),
    );
    const saved = await this.repository.save(entities);
    return saved.map((e) => RatingItemMapper.toDomain(e));
  }

  async findById(id: number): Promise<RatingItem | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? RatingItemMapper.toDomain(entity) : null;
  }

  async findByRatingId(ratingId: number): Promise<RatingItem[]> {
    const entities = await this.repository.find({
      where: { rating_id: ratingId },
      order: { id: 'ASC' },
    });
    return entities.map((e) => RatingItemMapper.toDomain(e));
  }

  async update(
    id: number,
    data: Partial<RatingItem>,
  ): Promise<RatingItem | null> {
    await this.repository.update(id, RatingItemMapper.toEntity(data));
    return this.findById(id);
  }

  async softDelete(id: number, deletedBy?: number): Promise<void> {
    await this.repository.update(id, {
      deleted_by: deletedBy ?? null,
      deleted_at: new Date(),
    });
  }

  async softDeleteByRatingId(
    ratingId: number,
    deletedBy?: number,
  ): Promise<void> {
    await this.repository.update(
      { rating_id: ratingId },
      {
        deleted_by: deletedBy ?? null,
        deleted_at: new Date(),
      },
    );
  }
}
