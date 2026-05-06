import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BaseRatingRepository } from '@/ratings/persistence/base-rating.repository';
import { RatingEntity } from '@/ratings/persistence/entities/rating.entity';
import { RatingMapper } from '@/ratings/persistence/mappers/rating.mapper';
import { Rating } from '@/ratings/domain/rating';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class RatingRepository implements BaseRatingRepository {
  constructor(
    @InjectRepository(RatingEntity)
    private readonly repository: Repository<RatingEntity>,
  ) {}

  async create(
    data: Omit<Rating, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Rating> {
    const entity = this.repository.create(RatingMapper.toEntity(data));
    const saved = await this.repository.save(entity);
    return RatingMapper.toDomain(saved);
  }

  async findById(id: number): Promise<Rating | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? RatingMapper.toDomain(entity) : null;
  }

  async findByBookingId(bookingId: number): Promise<Rating | null> {
    const entity = await this.repository.findOne({
      where: { booking_id: bookingId, deleted_at: IsNull() },
    });
    return entity ? RatingMapper.toDomain(entity) : null;
  }

  async findBySellerId(
    sellerId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [entities, totalCount] = await this.repository.findAndCount({
      where: { seller_id: sellerId, is_public: true, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((e) => RatingMapper.toDomain(e)),
      totalResults: totalCount,
    };
  }

  async findByCustomerId(
    customerId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [entities, totalCount] = await this.repository.findAndCount({
      where: { customer_id: customerId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((e) => RatingMapper.toDomain(e)),
      totalResults: totalCount,
    };
  }

  async findByServiceId(
    serviceId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [entities, totalCount] = await this.repository.findAndCount({
      where: { service_id: serviceId, is_public: true, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((e) => RatingMapper.toDomain(e)),
      totalResults: totalCount,
    };
  }

  async update(id: number, data: Partial<Rating>): Promise<Rating | null> {
    await this.repository.update(id, RatingMapper.toEntity(data));
    return this.findById(id);
  }

  async softDelete(id: number, deletedBy?: number): Promise<void> {
    await this.repository.update(id, {
      deleted_by: deletedBy ?? null,
      deleted_at: new Date(),
    });
  }

  async getSellerAverageRating(sellerId: number): Promise<number | null> {
    const result = await this.repository
      .createQueryBuilder('rating')
      .select('AVG(rating.overall_rating)', 'avg')
      .where('rating.seller_id = :sellerId', { sellerId })
      .andWhere('rating.is_public = :isPublic', { isPublic: true })
      .andWhere('rating.deleted_at IS NULL')
      .getRawOne();

    return result?.avg ? Number(result.avg) : null;
  }

  async getServiceAverageRating(serviceId: number): Promise<number | null> {
    const result = await this.repository
      .createQueryBuilder('rating')
      .select('AVG(rating.overall_rating)', 'avg')
      .where('rating.service_id = :serviceId', { serviceId })
      .andWhere('rating.is_public = :isPublic', { isPublic: true })
      .andWhere('rating.deleted_at IS NULL')
      .getRawOne();

    return result?.avg ? Number(result.avg) : null;
  }
}
