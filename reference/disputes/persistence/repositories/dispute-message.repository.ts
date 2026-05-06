import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseDisputeMessageRepository } from '../base-dispute-message.repository';
import { DisputeMessageEntity } from '../entities/dispute-message.entity';
import { DisputeMessage } from '@/disputes/domain/dispute-message';
import { DisputeMessageMapper } from '../mappers/dispute-message.mapper';

/**
 * Concrete implementation of dispute message repository.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class DisputeMessageRepository extends BaseDisputeMessageRepository {
  constructor(
    @InjectRepository(DisputeMessageEntity)
    private readonly repository: Repository<DisputeMessageEntity>,
  ) {
    super();
  }

  async create(message: DisputeMessage): Promise<DisputeMessage> {
    const entity = DisputeMessageMapper.toPersistence(message);
    const saved = await this.repository.save(entity);
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
    return DisputeMessageMapper.toDomain(withRelations!);
  }

  async findByDisputeId(disputeId: number): Promise<DisputeMessage[]> {
    const entities = await this.repository.find({
      where: { dispute_id: disputeId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
    return entities.map((e) => DisputeMessageMapper.toDomain(e));
  }
}
