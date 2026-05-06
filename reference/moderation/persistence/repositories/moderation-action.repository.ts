import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationActionEntity } from '../entities/moderation-action.entity';
import { ModerationAction } from '@/moderation/domain/moderation-action';
import { ModerationActionMapper } from '../mappers/moderation-action.mapper';

/**
 * Repository for moderation actions.
 *
 * Handles database operations for moderation actions using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ModerationActionRepository {
  constructor(
    @InjectRepository(ModerationActionEntity)
    private readonly repository: Repository<ModerationActionEntity>,
  ) {}

  async create(
    action: Omit<ModerationAction, 'id' | 'performed_at' | 'performer'>,
  ): Promise<ModerationAction> {
    const persistenceEntity = ModerationActionMapper.toPersistence(
      action as ModerationAction,
    );
    const savedEntity = await this.repository.save(persistenceEntity);

    const entity = await this.repository.findOne({
      where: { id: savedEntity.id },
      relations: ['performer'],
    });

    if (!entity) {
      throw new Error('Failed to create moderation action');
    }

    return ModerationActionMapper.toDomain(entity);
  }

  async findByModerationItemId(
    moderationItemId: number,
  ): Promise<ModerationAction[]> {
    const entities = await this.repository.find({
      where: { moderation_item_id: moderationItemId },
      relations: ['performer'],
      order: { performed_at: 'DESC' },
    });

    return entities.map((entity) => ModerationActionMapper.toDomain(entity));
  }
}
