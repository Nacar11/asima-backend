import { UserDetail } from '@/user-details/domain/user-detail';

export abstract class BaseUserDetailRepository {
  abstract findById(id: number): Promise<UserDetail | null>;

  abstract findByUserId(userId: number): Promise<UserDetail | null>;

  abstract findByUsername(username: string): Promise<UserDetail | null>;

  abstract create(data: Partial<UserDetail>): Promise<UserDetail>;

  abstract update(id: number, data: Partial<UserDetail>): Promise<UserDetail>;
}
