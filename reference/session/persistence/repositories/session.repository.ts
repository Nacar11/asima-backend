import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SessionEntity } from '@/session/persistence/entities/session.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { BaseSessionRepository } from '@/session/persistence/base-session.repository';
import { Session } from '@/session/domain/session';
import { SessionMapper } from '@/session/persistence/mappers/session.mapper';
import { User } from '@/users/domain/user';

@Injectable()
export class SessionRepository implements BaseSessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    const entity = await this.sessionRepository.findOne({
      where: {
        id: Number(id),
      },
      relations: {
        user: {
          seller: true,
        },
      },
    });

    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async create(data: Session): Promise<Session> {
    const persistenceModel = SessionMapper.toPersistence(data);

    const newEntity = await this.sessionRepository.save(
      this.sessionRepository.create(persistenceModel),
    );

    return SessionMapper.toDomain(newEntity);
  }

  async update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
    >,
  ): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      throw new Error('Session not found');
    }

    const updatedEntity = await this.sessionRepository.save(
      this.sessionRepository.create(
        SessionMapper.toPersistence({
          ...SessionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return SessionMapper.toDomain(updatedEntity);
  }

  async deleteById(id: Session['id']): Promise<void> {
    await this.sessionRepository.softDelete({
      id: Number(id),
    });
  }

  async deleteByUserId(conditions: { user_id: User['id'] }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: {
        id: Number(conditions.user_id),
      },
    });
  }

  async deleteByUserIdWithExclude(conditions: {
    user_id: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: {
        id: Number(conditions.user_id),
      },
      id: Not(Number(conditions.excludeSessionId)),
    });
  }
}
