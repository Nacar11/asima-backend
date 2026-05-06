import { Injectable } from '@nestjs/common';

import { BaseSessionRepository } from '@/session/persistence/base-session.repository';
import { Session } from '@/session/domain/session';
import { User } from '@/users/domain/user';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: BaseSessionRepository) {}

  findById(id: Session['id']): Promise<NullableType<Session>> {
    return this.sessionRepository.findById(id);
  }

  create(
    data: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Session> {
    return this.sessionRepository.create(data);
  }

  update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
    >,
  ): Promise<Session | null> {
    return this.sessionRepository.update(id, payload);
  }

  deleteById(id: Session['id']): Promise<void> {
    return this.sessionRepository.deleteById(id);
  }

  deleteByUserId(conditions: { user_id: User['id'] }): Promise<void> {
    return this.sessionRepository.deleteByUserId(conditions);
  }

  deleteByUserIdWithExclude(conditions: {
    user_id: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(conditions);
  }
}
