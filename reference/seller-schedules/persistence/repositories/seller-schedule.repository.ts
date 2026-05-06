import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { SellerScheduleMapper } from '@/seller-schedules/persistence/mappers/seller-schedule.mapper';
import { SellerSchedule } from '@/seller-schedules/domain/seller-schedule';
import { QuerySellerScheduleDto } from '@/seller-schedules/dto/query-seller-schedule.dto';

@Injectable()
export class SellerScheduleRepository implements BaseSellerScheduleRepository {
  constructor(
    @InjectRepository(SellerScheduleEntity)
    private readonly repo: Repository<SellerScheduleEntity>,
  ) {}

  async create(data: SellerSchedule): Promise<SellerSchedule> {
    const saved = await this.repo.save(
      this.repo.create(SellerScheduleMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['seller', 'created_by', 'updated_by', 'deleted_by'],
    });
    return SellerScheduleMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QuerySellerScheduleDto,
  ): Promise<{ data: SellerSchedule[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<SellerScheduleEntity> = {};
    if (query.seller_id !== undefined) where.seller_id = query.seller_id;
    if (query.day_of_week !== undefined) where.day_of_week = query.day_of_week;
    if (query.status !== undefined) where.status = query.status;

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: ['seller', 'created_by', 'updated_by', 'deleted_by'],
    });

    return {
      data: entities.map((e) => SellerScheduleMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<SellerSchedule | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['seller', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? SellerScheduleMapper.toDomain(entity) : null;
  }

  async findBySellerAndDay(
    seller_id: number,
    day_of_week: number,
  ): Promise<SellerSchedule | null> {
    const entity = await this.repo.findOne({
      where: { seller_id, day_of_week },
      relations: ['seller', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? SellerScheduleMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerSchedule>,
  ): Promise<SellerSchedule> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Seller schedule not found');

    const updated = await this.repo.save(
      this.repo.create(
        SellerScheduleMapper.toPersistence({
          ...SellerScheduleMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['seller', 'created_by', 'updated_by', 'deleted_by'],
    });
    return SellerScheduleMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Seller schedule not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
    });
  }
}
