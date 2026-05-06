import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, OrderByCondition } from 'typeorm';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { Media } from '@/media/domain/media';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

interface FindAllOptions {
  where: any;
  skip: number;
  take: number;
  orderBy: OrderByCondition;
}

@Injectable()
export class MediaRepository {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly repository: Repository<MediaEntity>,
  ) {}

  async create(data: Media): Promise<Media> {
    const persistenceModel = MediaMapper.toEntity(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return MediaMapper.toDomain(newEntity);
  }

  async findById(id: number): Promise<Media | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? MediaMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<Media[]> {
    if (ids.length === 0) {
      return [];
    }
    const entities = await this.repository
      .createQueryBuilder('media')
      .whereInIds(ids)
      .getMany();
    return entities.map((entity) => MediaMapper.toDomain(entity));
  }

  async findAll(options: FindAllOptions): Promise<{
    data: Media[];
    totalCount: number;
  }> {
    const qb = this.repository
      .createQueryBuilder('pm')
      .orderBy(options.orderBy)
      .skip(options.skip)
      .take(options.take);

    // Add where conditions
    if (options.where) {
      if (typeof options.where === 'string') {
        qb.where(options.where);
      } else {
        qb.where(options.where);
      }
    }

    const [entities, totalCount] = await qb.getManyAndCount();
    return {
      data: await Promise.all(
        entities.map((entity) => MediaMapper.toDomain(entity)),
      ),
      totalCount,
    };
  }

  async update(id: number, data: Partial<Media>): Promise<Media> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error('Media not found');
    }

    Object.assign(entity, data);
    const updated = await this.repository.save(entity);
    return MediaMapper.toDomain(updated);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
