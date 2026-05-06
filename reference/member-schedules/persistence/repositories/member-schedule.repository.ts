import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseMemberScheduleRepository } from '@/member-schedules/persistence/base-member-schedule.repository';
import { MemberScheduleEntity } from '@/member-schedules/persistence/entities/member-schedule.entity';
import { MemberScheduleMapper } from '@/member-schedules/persistence/mappers/member-schedule.mapper';
import { MemberSchedule } from '@/member-schedules/domain/member-schedule';
import { QueryMemberScheduleDto } from '@/member-schedules/dto/query-member-schedule.dto';

@Injectable()
export class MemberScheduleRepository implements BaseMemberScheduleRepository {
  constructor(
    @InjectRepository(MemberScheduleEntity)
    private readonly repo: Repository<MemberScheduleEntity>,
  ) {}

  async create(data: MemberSchedule): Promise<MemberSchedule> {
    const saved = await this.repo.save(
      this.repo.create(MemberScheduleMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return MemberScheduleMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryMemberScheduleDto,
  ): Promise<{ data: MemberSchedule[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const qb = this.repo
      .createQueryBuilder('memberSchedule')
      .leftJoinAndSelect('memberSchedule.seller_member', 'seller_member')
      .leftJoinAndSelect('memberSchedule.created_by', 'created_by')
      .leftJoinAndSelect('memberSchedule.updated_by', 'updated_by')
      .leftJoinAndSelect('memberSchedule.deleted_by', 'deleted_by')
      .orderBy('memberSchedule.created_at', 'DESC')
      .skip(skip)
      .take(take);

    if (query.seller_member_id !== undefined) {
      qb.andWhere('memberSchedule.seller_member_id = :seller_member_id', {
        seller_member_id: query.seller_member_id,
      });
    }
    if (query.seller_id !== undefined) {
      qb.andWhere('seller_member.seller_id = :seller_id', {
        seller_id: query.seller_id,
      });
    }
    if (query.day_of_week !== undefined) {
      qb.andWhere('memberSchedule.day_of_week = :day_of_week', {
        day_of_week: query.day_of_week,
      });
    }
    if (query.status !== undefined) {
      qb.andWhere('memberSchedule.status = :status', {
        status: query.status,
      });
    }

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => MemberScheduleMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<MemberSchedule | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? MemberScheduleMapper.toDomain(entity) : null;
  }

  async findByMemberAndDay(
    seller_member_id: number,
    day_of_week: number,
  ): Promise<MemberSchedule | null> {
    const entity = await this.repo.findOne({
      where: { seller_member_id, day_of_week },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? MemberScheduleMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<MemberSchedule>,
  ): Promise<MemberSchedule> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Member schedule not found');

    const updated = await this.repo.save(
      this.repo.create(
        MemberScheduleMapper.toPersistence({
          ...MemberScheduleMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['seller_member', 'created_by', 'updated_by', 'deleted_by'],
    });
    return MemberScheduleMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Member schedule not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
    });
  }
}
