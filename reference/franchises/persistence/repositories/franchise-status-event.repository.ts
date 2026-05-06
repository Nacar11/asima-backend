import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseFranchiseStatusEventRepository } from '@/franchises/persistence/base-franchise-status-event.repository';
import { FranchiseStatusEventEntity } from '@/franchises/persistence/entities/franchise-status-event.entity';
import { FranchiseStatusEventMapper } from '@/franchises/persistence/mappers/franchise-status-event.mapper';
import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

/**
 * Concrete repository for franchise status event persistence operations
 */
@Injectable()
export class FranchiseStatusEventRepository extends BaseFranchiseStatusEventRepository {
  constructor(
    @InjectRepository(FranchiseStatusEventEntity)
    private readonly eventsRepository: Repository<FranchiseStatusEventEntity>,
  ) {
    super();
  }

  async create(
    franchiseId: number,
    previousStatus: FranchiseStatusEnum | null,
    newStatus: FranchiseStatusEnum,
    description: string | null,
    createdById: number,
  ): Promise<FranchiseStatusEvent> {
    const entity = this.eventsRepository.create({
      franchise_id: franchiseId,
      previous_status: previousStatus,
      new_status: newStatus,
      description,
      created_by: { id: createdById } as any,
    });

    const savedEntity = await this.eventsRepository.save(entity);
    const entityWithRelations = await this.eventsRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['created_by'],
    });

    return FranchiseStatusEventMapper.toDomain(
      entityWithRelations || savedEntity,
    );
  }

  async findByFranchiseId(
    franchiseId: number,
  ): Promise<FranchiseStatusEvent[]> {
    const entities = await this.eventsRepository.find({
      where: { franchise_id: franchiseId },
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) =>
      FranchiseStatusEventMapper.toDomain(entity),
    );
  }
}
