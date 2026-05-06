import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { StoreUnavailabilityMapper } from '@/store-unavailability/persistence/mappers/store-unavailability.mapper';
import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { QueryStoreUnavailabilityDto } from '@/store-unavailability/dto/query-store-unavailability.dto';

@Injectable()
export class StoreUnavailabilityRepository
  implements BaseStoreUnavailabilityRepository
{
  constructor(
    @InjectRepository(StoreUnavailabilityEntity)
    private readonly repo: Repository<StoreUnavailabilityEntity>,
  ) {}

  async create(data: StoreUnavailability): Promise<StoreUnavailability> {
    const saved = await this.repo.save(
      this.repo.create(StoreUnavailabilityMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return StoreUnavailabilityMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryStoreUnavailabilityDto,
  ): Promise<{ data: StoreUnavailability[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.seller', 'seller')
      .leftJoinAndSelect('u.service', 'service')
      .leftJoinAndSelect('u.created_by', 'created_by')
      .leftJoinAndSelect('u.updated_by', 'updated_by')
      .leftJoinAndSelect('u.deleted_by', 'deleted_by')
      .orderBy('u.unavailable_date', 'DESC')
      .addOrderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(take);

    if (query.seller_id !== undefined) {
      qb.andWhere('u.seller_id = :seller_id', { seller_id: query.seller_id });
    }
    if (query.service_id !== undefined) {
      qb.andWhere('u.service_id = :service_id', {
        service_id: query.service_id,
      });
    }
    if (query.unavailable_date !== undefined) {
      qb.andWhere('u.unavailable_date = :unavailable_date', {
        unavailable_date: query.unavailable_date,
      });
    }
    if (query.is_full_day !== undefined) {
      qb.andWhere('u.is_full_day = :is_full_day', {
        is_full_day: query.is_full_day,
      });
    }

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => StoreUnavailabilityMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<StoreUnavailability | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? StoreUnavailabilityMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<StoreUnavailability>,
  ): Promise<StoreUnavailability> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Store unavailability not found');

    const updated = await this.repo.save(
      this.repo.create(
        StoreUnavailabilityMapper.toPersistence({
          ...StoreUnavailabilityMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: [
        'seller',
        'service',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return StoreUnavailabilityMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Store unavailability not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
    });
  }

  async findOverlapsForWindow(params: {
    seller_id: number;
    service_id?: number | null;
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<StoreUnavailability[]> {
    const { seller_id, service_id, date, start_time, end_time } = params;
    const targetDate = String(date).trim();

    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.seller', 'seller')
      .where('u.seller_id = :seller_id', { seller_id })
      .andWhere('u.unavailable_date <= :target_date::date', {
        target_date: targetDate,
      })
      .andWhere(
        'COALESCE(u.end_date, u.unavailable_date) >= :target_date::date',
        {
          target_date: targetDate,
        },
      )
      .andWhere('u.status = :status', { status: 'Active' })
      .andWhere('(u.deleted_at IS NULL)');

    if (service_id !== undefined && service_id !== null) {
      qb.andWhere('(u.service_id IS NULL OR u.service_id = :service_id)', {
        service_id,
      });
    }

    qb.andWhere(
      `(
        (u.is_full_day = true)
        OR (
          u.is_full_day = false
          AND u.start_time IS NOT NULL
          AND u.end_time IS NOT NULL
          AND (
            (u.start_time <= :start_time AND u.end_time > :start_time)
            OR (u.start_time < :end_time AND u.end_time >= :end_time)
            OR (u.start_time >= :start_time AND u.end_time <= :end_time)
          )
        )
      )`,
      { start_time, end_time },
    );

    const entities = await qb.getMany();
    return entities.map((e) => StoreUnavailabilityMapper.toDomain(e));
  }
}
