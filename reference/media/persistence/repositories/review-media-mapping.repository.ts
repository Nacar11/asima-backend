import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { ReviewMediaMapping } from '@/media/domain/review-media-mapping';
import { ReviewMediaMappingMapper } from '@/media/persistence/mappers/review-media-mapping.mapper';

@Injectable()
export class ReviewMediaMappingRepository {
  constructor(
    @InjectRepository(ReviewMediaMappingEntity)
    private repository: Repository<ReviewMediaMappingEntity>,
  ) {}

  async create(domain: ReviewMediaMapping): Promise<ReviewMediaMapping> {
    const entity = ReviewMediaMappingMapper.toPersistence(domain);
    const savedEntity = await this.repository.save(entity);
    return ReviewMediaMappingMapper.toDomain(savedEntity);
  }

  async findByReviewId(reviewId: number): Promise<ReviewMediaMapping[]> {
    const entities = await this.repository
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.media', 'media')
      .where('mapping.review_id = :reviewId', { reviewId })
      .orderBy('mapping.display_order', 'ASC')
      .getMany();

    return entities.map((entity) => ReviewMediaMappingMapper.toDomain(entity));
  }

  async deleteByReviewId(reviewId: number): Promise<void> {
    await this.repository.delete({ review_id: reviewId });
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async createBatch(
    domains: ReviewMediaMapping[],
  ): Promise<ReviewMediaMapping[]> {
    const entities = domains.map((domain) =>
      ReviewMediaMappingMapper.toPersistence(domain),
    );
    const savedEntities = await this.repository.save(entities);
    return savedEntities.map((entity) =>
      ReviewMediaMappingMapper.toDomain(entity),
    );
  }
}
