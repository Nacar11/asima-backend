import { User } from '@/users/domain/user';
import { NullableType } from '@/utils/types/nullable.type';
import { Session } from '@/session/domain/session';

export abstract class BaseSessionRepository {
  abstract findById(id: Session['id']): Promise<NullableType<Session>>;

  abstract create(
    data: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Session>;

  abstract update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
    >,
  ): Promise<Session | null>;

  abstract deleteById(id: Session['id']): Promise<void>;

  abstract deleteByUserId(conditions: { user_id: User['id'] }): Promise<void>;

  abstract deleteByUserIdWithExclude(conditions: {
    user_id: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void>;
}
